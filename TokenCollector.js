require('dotenv').config();
const { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, createTransferInstruction, getMint, getAccount } = require('@solana/spl-token');
const bs58 = require('bs58');

const connection = new Connection(process.env.RPC_URL, 'confirmed');

const mainWalletPublicKey = new PublicKey(process.env.Source_walletPB);

const tokenMintAddress = new PublicKey(process.env.Token_Mint_Address);


const collectorWallets = Object.keys(process.env)
    .filter(key => key.startsWith('Private_Key'))
    .map(key => Keypair.fromSecretKey(bs58.decode(process.env[key])));

const collectTokens = async (collectSimultaneously) => {
  try {
    const mintInfo = await getMint(connection, tokenMintAddress);
    const decimals = mintInfo.decimals;

    const formatBalance = (amount) => {
      return Number(amount) / Math.pow(10, decimals);
    };

    const collectionPromises = collectorWallets.map(async (wallet, i) => {
      try {
        const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          wallet,
          tokenMintAddress,
          wallet.publicKey
        );

        const tokenAccountInfo = await getAccount(connection, sourceTokenAccount.address);
        const tokenBalance = tokenAccountInfo.amount;

        if (tokenBalance > 0n) {  
          console.log(`Collecting ${formatBalance(tokenBalance)} tokens from Wallet ${i + 1} (${wallet.publicKey.toString()})`);

          const mainTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            wallet, 
            tokenMintAddress,
            mainWalletPublicKey
          );

          const transferInstruction = createTransferInstruction(
            sourceTokenAccount.address, 
            mainTokenAccount.address, 
            wallet.publicKey, 
            tokenBalance 
          );

          const transaction = new Transaction().add(transferInstruction);
          transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          transaction.feePayer = wallet.publicKey;

          const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);

          console.log(`\x1b[32mSuccessfully transferred tokens from Wallet ${i + 1}. https://solscan.io/tx/${signature}\x1b[0m`);
        } else {
          console.log(`Wallet ${i + 1} (${wallet.publicKey.toString()}) has no tokens to collect.`);
        }
      } catch (error) {
        console.error(`Failed to collect tokens from Wallet ${i + 1} (${wallet.publicKey.toString()}):`, error.message);
      }
    });

    if (collectSimultaneously) {
      await Promise.all(collectionPromises);
    } else {
      for (const promise of collectionPromises) {
        await promise;
      }
    }
  } catch (error) {
    console.error('Failed to collect SPL tokens:', error.message);
  }
};

module.exports = { collectTokens };

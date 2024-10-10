require('dotenv').config();
const { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, createTransferInstruction, getMint, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const bs58 = require('bs58');

const connection = new Connection(process.env.RPC_URL, 'confirmed');


const senderSecretKey = bs58.decode(process.env.Source_walletPK);
const senderKeypair = Keypair.fromSecretKey(senderSecretKey);


const tokenMintAddress = new PublicKey(process.env.Token_Mint_Address);


const recipientPublicKeys = Object.keys(process.env)
    .filter(key => key.startsWith('Public_Key'))
    .map(key => new PublicKey(process.env[key]));

const distributeSPLTokens = async (amountInTokens, distributeSimultaneously) => {
  try {

    const { blockhash } = await connection.getLatestBlockhash();

    
    const mintInfo = await getMint(connection, tokenMintAddress);
    const decimals = mintInfo.decimals;

    
    const amountToTransfer = amountInTokens * Math.pow(10, decimals);

    
    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      senderKeypair,
      tokenMintAddress,
      senderKeypair.publicKey
    );

    const transactions = recipientPublicKeys.map(async (recipientPublicKey, i) => {
      
      let recipientTokenAccount;
      try {
        recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          senderKeypair,
          tokenMintAddress,
          recipientPublicKey
        );
      } catch (error) {
        console.error(`Failed to create or retrieve recipient's associated token account for Wallet ${i + 1}:`, error.message);
        return;
      }

      
      const transferInstruction = createTransferInstruction(
        senderTokenAccount.address, 
        recipientTokenAccount.address, 
        senderKeypair.publicKey,
        amountToTransfer,
        [],
        TOKEN_PROGRAM_ID
      );

      
      const transaction = new Transaction().add(transferInstruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderKeypair.publicKey;

      try {
        const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
        console.log(`\x1b[32mTransfer to Wallet ${i + 1} successful, signature: https://solscan.io/tx/${signature}\x1b[0m`);
      } catch (error) {
        console.error(`Failed to transfer to Wallet ${i + 1}:`, error.message);
      }
    });

    if (distributeSimultaneously) {
        await Promise.all(transactions);
    } else {
        for (const transaction of transactions) {
            await transaction;
        }
    }
  } catch (error) {
    console.error('Failed to distribute SPL tokens:', error.message);
  }
};

module.exports = { distributeSPLTokens };

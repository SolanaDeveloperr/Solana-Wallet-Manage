require('dotenv').config();
const { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, SendTransactionError } = require('@solana/web3.js');
const bs58 = require('bs58');

const connection = new Connection(process.env.RPC_URL, 'confirmed');

const destinationPublicKey = new PublicKey(process.env.Source_walletPB);

const collectorWallets = Object.keys(process.env)
    .filter(key => key.startsWith('Private_Key'))
    .map(key => Keypair.fromSecretKey(bs58.decode(process.env[key])));

const getBalance = async (publicKey) => {
  const balance = await connection.getBalance(publicKey);
  return balance;
};

const transferAllFunds = async (fromWallet, walletNumber) => {
  try {
    const balance = await getBalance(fromWallet.publicKey);

    if (balance > 0) {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromWallet.publicKey,
          toPubkey: destinationPublicKey,
          lamports: 1, 
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromWallet.publicKey;

      const fee = await transaction.getEstimatedFee(connection);

      if (balance > fee) {
        const amountToTransfer = balance - fee;

        const actualTransaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromWallet.publicKey,
            toPubkey: destinationPublicKey,
            lamports: amountToTransfer,
          })
        );

        const signature = await sendAndConfirmTransaction(
          connection,
          actualTransaction,
          [fromWallet]
        );

        console.log(`\x1b[32mTransfer from Wallet ${walletNumber} successful, signature: https://solscan.io/tx/${signature}\x1b[0m`);
      } else {
        console.log(`\x1b[31mNot enough balance in Wallet ${walletNumber} to cover the fee\x1b[0m`);
      }
    } else {
      console.log(`\x1b[31mNo balance in Wallet ${walletNumber} to transfer\x1b[0m`);
    }
  } catch (error) {
    if (error instanceof SendTransactionError) {
      console.error(`\x1b[31mSendTransactionError encountered for Wallet ${walletNumber}:\x1b[0m`, error.message);
      console.error('Transaction logs:', error.logs);
    } else {
      console.error(`\x1b[31mError during transfer from Wallet ${walletNumber}:\x1b[0m`, error.message);
    }
  }
};

const collectSol = async (collectAllAtOnce = false) => {
  if (collectAllAtOnce) {
    const transactions = collectorWallets.map((wallet, index) => {
      return transferAllFunds(wallet, index + 1);
    });
    await Promise.all(transactions); 
  } else {
    for (let i = 0; i < collectorWallets.length; i++) {
      await transferAllFunds(collectorWallets[i], i + 1); 
    }
  }
};

module.exports = { collectSol };

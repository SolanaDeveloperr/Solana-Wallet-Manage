require('dotenv').config();
const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const bs58 = require('bs58');

const connection = new Connection(process.env.RPC_URL, "confirmed");

const senderSecretKey = bs58.decode(process.env.Source_walletPK);
const senderKeypair = Keypair.fromSecretKey(senderSecretKey);

const recipientPublicKeys = Object.keys(process.env)
    .filter(key => key.startsWith('Public_Key'))
    .map(key => new PublicKey(process.env[key]));

async function distributeSol(amountInSOL, executeAllAtOnce = false) {
    const amountInLamports = amountInSOL * LAMPORTS_PER_SOL;

    if (executeAllAtOnce) {
        const transactions = recipientPublicKeys.map(recipientPublicKey => {
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: senderKeypair.publicKey,
                    toPubkey: recipientPublicKey,
                    lamports: amountInLamports,
                })
            );
            return transaction;
        });

        try {
            const signatures = await Promise.all(transactions.map(transaction =>
                sendAndConfirmTransaction(connection, transaction, [senderKeypair])
            ));
            signatures.forEach((signature, index) => {
                console.log(`\x1b[32mWallet ${index + 1} Transaction successful signature: https://solscan.io/tx/${signature}\x1b[0m`);
            });
        } catch (error) {
            console.error(`\x1b[31mTransaction failed:\x1b[0m`, error);
        }
    } else {
        for (let i = 0; i < recipientPublicKeys.length; i++) {
            const recipientPublicKey = recipientPublicKeys[i];
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: senderKeypair.publicKey,
                    toPubkey: recipientPublicKey,
                    lamports: amountInLamports,
                })
            );

            try {
                const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
                console.log(`\x1b[32mWallet ${i + 1} Transaction successful signature: https://solscan.io/tx/${signature}\x1b[0m`);
            } catch (error) {
                console.error(`\x1b[31mWallet ${i + 1} Transaction failed:\x1b[0m`, error);
            }
        }
    }
}

module.exports = { distributeSol };

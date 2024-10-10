const fs = require('fs');
const bs58 = require('bs58');
const { Keypair } = require('@solana/web3.js');

function generateSolanaWallet() {
    
    const keypair = Keypair.generate();

    const publicKey = keypair.publicKey.toBase58();
    const privateKey = bs58.encode(Buffer.from(keypair.secretKey));

    return {
        publicKey,
        privateKey
    };
}

function saveWalletToFile(wallets, fileName) {
    let data = '';

    wallets.forEach((wallet, index) => {
        data += `Public_Key${index + 1} = ${wallet.publicKey}\n`;
        data += `Private_Key${index + 1} = ${wallet.privateKey}\n\n`;
    });

    fs.writeFileSync(fileName, data, 'utf8');
    console.log(`Wallets saved to ${fileName}`);
}

async function generateWallets(numWallets) {
    const wallets = [];

    for (let i = 0; i < numWallets; i++) {
        const wallet = generateSolanaWallet();
        wallets.push(wallet);
    }

    saveWalletToFile(wallets, 'wallets.txt');
}

module.exports = {
    generateWallets
};

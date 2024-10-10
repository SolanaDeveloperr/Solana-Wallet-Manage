require('dotenv').config();
const { Connection, PublicKey } = require('@solana/web3.js');
const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = require('@solana/spl-token');

const connection = new Connection(process.env.RPC_URL, 'confirmed');


const sourceWalletPublicKey = new PublicKey(process.env.Source_walletPB);


const tokenMintAddress = process.env.Token_Mint_Address ? new PublicKey(process.env.Token_Mint_Address) : null;


const recipientPublicKeys = Object.keys(process.env)
    .filter(key => key.startsWith('Public_Key'))
    .map(key => new PublicKey(process.env[key]));

const printBalances = async () => {
    try {
        
        const sourceBalance = await connection.getBalance(sourceWalletPublicKey);
        const sourceBalanceInSOL = Number(sourceBalance) / 1e9; 

        let sourceTokenBalanceFormatted = 0;

        if (tokenMintAddress) {
            const sourceTokenAccountAddress = await getAssociatedTokenAddress(
                tokenMintAddress,
                sourceWalletPublicKey,
                false,
                TOKEN_PROGRAM_ID
            );

            try {
                const tokenAccountInfo = await connection.getParsedAccountInfo(sourceTokenAccountAddress);
                const tokenAccountData = tokenAccountInfo.value?.data?.parsed?.info;

                if (tokenAccountData) {
                    const sourceTokenBalance = tokenAccountData.tokenAmount?.amount;
                    const sourceTokenDecimals = tokenAccountData.tokenAmount?.decimals;

                    if (sourceTokenBalance !== undefined && sourceTokenDecimals !== undefined) {
                        sourceTokenBalanceFormatted = Number(sourceTokenBalance) / Math.pow(10, sourceTokenDecimals);
                    }
                }
            } catch (error) {
                console.log(`\x1b[32mSource Wallet (${sourceWalletPublicKey.toString()}): Unable to retrieve token balance. Error: ${error.message}\x1b[0m`);
            }
        }

        if (tokenMintAddress) {
            console.log(`\x1b[32mSource Wallet (${sourceWalletPublicKey.toString()}): ${sourceBalanceInSOL} SOL, ${sourceTokenBalanceFormatted} Tokens\x1b[0m`);
        } else {
            console.log(`\x1b[32mSource Wallet (${sourceWalletPublicKey.toString()}): ${sourceBalanceInSOL} SOL\x1b[0m`);
        }
    } catch (error) {
        console.error(`Failed to retrieve balance for Source Wallet (${sourceWalletPublicKey.toString()}):`, error.message);
    }

    
    for (let i = 0; i < recipientPublicKeys.length; i++) {
        const recipientPublicKey = recipientPublicKeys[i];
        try {
            // Get SOL balance
            const balance = await connection.getBalance(recipientPublicKey);
            const balanceInSOL = Number(balance) / 1e9; 

            let tokenBalanceFormatted = 0;

            if (tokenMintAddress) {
                const tokenAccountAddress = await getAssociatedTokenAddress(
                    tokenMintAddress,
                    recipientPublicKey,
                    false,
                    TOKEN_PROGRAM_ID
                );

                try {
                    const tokenAccountInfo = await connection.getParsedAccountInfo(tokenAccountAddress);
                    const tokenAccountData = tokenAccountInfo.value?.data?.parsed?.info;

                    if (tokenAccountData) {
                        const tokenBalance = tokenAccountData.tokenAmount?.amount;
                        const tokenDecimals = tokenAccountData.tokenAmount?.decimals;

                        if (tokenBalance !== undefined && tokenDecimals !== undefined) {
                            tokenBalanceFormatted = Number(tokenBalance) / Math.pow(10, tokenDecimals);
                        }
                    }
                } catch (error) {
                    console.log(`Public Key ${i + 1} (${recipientPublicKey.toString()}): Unable to retrieve token balance. Error: ${error.message}`);
                }
            }

            if (tokenMintAddress) {
                console.log(`Public Key ${i + 1} (${recipientPublicKey.toString()}): ${balanceInSOL} SOL, ${tokenBalanceFormatted} Tokens`);
            } else {
                console.log(`Public Key ${i + 1} (${recipientPublicKey.toString()}): ${balanceInSOL} SOL`);
            }

        } catch (error) {
            console.error(`Failed to retrieve balance for Public Key ${i + 1} (${recipientPublicKey.toString()}):`, error.message);
        }
    }
};

module.exports = { printBalances };

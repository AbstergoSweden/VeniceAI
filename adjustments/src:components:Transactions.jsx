import React, { useCallback, useEffect, useState } from "react";
import { BrowserProvider, Contract, formatEther, parseEther, isAddress } from "ethers";
import { contractABI, contractAddress, shortenAddress } from "../utils/constants";
import { Loader2 } from "lucide-react";

/**
 * Transactions component for interacting with the Ethereum blockchain.
 * Allows users to send ETH and view transaction history.
 *
 * @returns {JSX.Element} The transactions UI.
 */
const Transactions = () => {
    const [currentAccount, setCurrentAccount] = useState("");
    const [formData, setFormData] = useState({ addressTo: "", amount: "", keyword: "", message: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [networkPrefix, setNetworkPrefix] = useState("sepolia.");

    const { ethereum } = window;

    useEffect(() => {
        if (ethereum) {
            ethereum.request({ method: 'eth_chainId' })
                .then(chainId => {
                    if (chainId === '0x1') setNetworkPrefix("");
                    else if (chainId === '0xaa36a7') setNetworkPrefix("sepolia.");
                    else if (chainId === '0x5') setNetworkPrefix("goerli.");
                })
                .catch(err => console.error("Failed to get chainId", err));
        }
    }, [ethereum]);

    /**
     * Creates an Ethereum contract instance.
     * @returns {Promise<Contract|null>} The contract instance or null if ethereum object is missing.
     */
    const createEthereumContract = useCallback(async () => {
        if (!ethereum) return null;
        const provider = new BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const transactionsContract = new Contract(contractAddress, contractABI, signer);
        return transactionsContract;
    }, [ethereum]);

    /**
     * Fetches all transactions from the blockchain.
     */
    const getAllTransactions = useCallback(async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");
            const contract = await createEthereumContract();
            if (!contract) return;

            const availableTransactions = await contract.getAllTransactions();

            const structuredTransactions = availableTransactions.map((transaction) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(Number(transaction.timestamp) * 1000).toLocaleString(),
                message: transaction.message,
                keyword: transaction.keyword,
                amount: formatEther(transaction.amount)
            }));

            setTransactions(structuredTransactions);
        } catch (error) {
            console.error(error);
        }
    }, [createEthereumContract, ethereum]);

    /**
     * Connects the wallet to the application.
     */
    const connectWallet = useCallback(async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");
            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.error(error);
            throw new Error("No ethereum object");
        }
    }, [ethereum]);

    /**
     * Sends a transaction to the blockchain.
     * * KNOWN ISSUE: Transaction Atomicity
     * * This function performs two separate user actions:
     * 1. Sends ETH via ethereum.request (lines 109-117)
     * 2. Records transaction in smart contract via contract.addToBlockchain (line 119)
     * * If the user approves step 1 but rejects step 2, or if step 2 fails,
     * the funds are transferred but not recorded in the application's history.
     * * PROPER FIX: The smart contract should be rewritten to accept the payable
     * amount and forward it to the receiver in a single atomic transaction.
     * This would require modifying the contract's addToBlockchain function to
     * be payable and handle the ETH transfer internally.
     */
    const sendTransaction = async () => {
        const { addressTo, amount, keyword, message } = formData;
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            // Validate Ethereum address
            if (!isAddress(addressTo)) {
                return alert("Invalid Ethereum address.");
            }

            const contract = await createEthereumContract();
            if (!contract) return;

            let parsedAmount;
            try {
                parsedAmount = parseEther(amount);
                if (parsedAmount <= 0) {
                    return alert("Amount must be greater than zero.");
                }
            } catch {
                return alert("Invalid amount. Please enter a valid number.");
            }

            await ethereum.request({
                method: "eth_sendTransaction",
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: "0x5208",
                    value: `0x${parsedAmount.toString(16)}`,
                }],
            });

            const transactionHash = await contract.addToBlockchain(addressTo, parsedAmount, message, keyword);
            setIsLoading(true);
            await transactionHash.wait();
            setIsLoading(false);

            // Reload transactions
            getAllTransactions();
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    /**
     * Handles form input changes.
     * @param {Event} e - The input change event.
     * @param {string} name - The name of the field being changed.
     */
    const handleChange = (e, name) => {
        setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
    };

    useEffect(() => {
        const init = async () => {
            try {
                if (!ethereum) return; // Silent return instead of alert

                const accounts = await ethereum.request({ method: "eth_accounts" });

                if (accounts.length) {
                    setCurrentAccount(accounts[0]);
                    getAllTransactions();
                } else {
                    console.log("No accounts found");
                }
            } catch (error) {
                console.log(error);
            }
        };
        init();
    }, [ethereum, getAllTransactions]);

    return (
        <div className="flex w-full justify-center items-center 2xl:px-20 gradient-bg-transactions">
            <div className="flex flex-col md:flex-row w-full justify-between items-start p-12 px-4">
                <div className="flex flex-1 justify-start items-start flex-col mf:mr-10">
                    <h1 className="text-3xl sm:text-5xl text-on-surface text-gradient py-1">
                        Send Crypto <br /> across the world
                    </h1>
                    <p className="text-left mt-5 text-on-surface-variant font-light md:w-9/12 w-11/12 text-base">
                        Explore the crypto world. Buy and sell cryptocurrencies on Krypto.
                    </p>
                    {!currentAccount && (
                        <button
                            type="button"
                            onClick={connectWallet}
                            className="flex flex-row justify-center items-center my-5 bg-primary p-3 rounded-full cursor-pointer hover:bg-primary/90 transition"
                        >
                            <p className="text-on-primary text-base font-semibold">
                                Connect Wallet
                            </p>
                        </button>
                    )}

                    <div className="p-5 sm:w-96 w-full flex flex-col justify-start items-center blue-glassmorphism bg-surface-container rounded-xl border border-outline-variant">
                        <input placeholder="Address To" name="addressTo" type="text" onChange={(e) => handleChange(e, "addressTo")} className="my-2 w-full rounded-lg p-2 outline-none bg-surface-container-high text-on-surface border border-outline/50 text-sm focus:border-primary" />
                        <input placeholder="Amount (ETH)" name="amount" type="number" onChange={(e) => handleChange(e, "amount")} className="my-2 w-full rounded-lg p-2 outline-none bg-surface-container-high text-on-surface border border-outline/50 text-sm focus:border-primary" />
                        <input placeholder="Keyword (Gif)" name="keyword" type="text" onChange={(e) => handleChange(e, "keyword")} className="my-2 w-full rounded-lg p-2 outline-none bg-surface-container-high text-on-surface border border-outline/50 text-sm focus:border-primary" />
                        <input placeholder="Enter Message" name="message" type="text" onChange={(e) => handleChange(e, "message")} className="my-2 w-full rounded-lg p-2 outline-none bg-surface-container-high text-on-surface border border-outline/50 text-sm focus:border-primary" />

                        <div className="h-[1px] w-full bg-outline-variant my-2" />

                        {isLoading ? (
                            <Loader2 className="animate-spin text-primary w-8 h-8" />
                        ) : (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (!formData.addressTo || !formData.amount) return;
                                    sendTransaction();
                                }}
                                className="text-on-primary w-full mt-2 bg-primary hover:bg-primary/90 p-2 rounded-full cursor-pointer transition font-medium"
                            >
                                Send now
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col flex-1 items-center justify-start w-full mf:mt-0 mt-10">
                    <h3 className="text-on-surface text-3xl text-center my-2">
                        Latest Transactions
                    </h3>
                    <div className="flex flex-wrap justify-center items-center mt-10">
                        {[...transactions].reverse().map((transaction, i) => (
                            <div key={i} className="bg-surface-container m-4 flex flex-1
                            2xl:min-w-[450px]
                            2xl:max-w-[500px]
                            sm:min-w-[270px]
                            sm:max-w-[300px]
                            min-w-full
                            flex-col p-3 rounded-xl border border-outline-variant hover:shadow-elevation-3 transition"
                            >
                                <div className="flex flex-col items-center w-full mt-3">
                                    <div className="display-flex justify-start w-full mb-6 p-2 text-on-surface-variant">
                                        <a href={`https://${networkPrefix}etherscan.io/address/${transaction.addressFrom}`} target="_blank" rel="noreferrer">
                                            <p className="text-sm truncate">From: {shortenAddress(transaction.addressFrom)}</p>
                                        </a>
                                        <a href={`https://${networkPrefix}etherscan.io/address/${transaction.addressTo}`} target="_blank" rel="noreferrer">
                                            <p className="text-sm truncate">To: {shortenAddress(transaction.addressTo)}</p>
                                        </a>
                                        <p className="text-sm">Amount: {transaction.amount} ETH</p>
                                        {transaction.message && (
                                            <>
                                                <br />
                                                <p className="text-sm">Message: {transaction.message}</p>
                                            </>
                                        )}
                                    </div>
                                    <div className="bg-surface-container-high p-3 px-5 w-max rounded-3xl -mt-5 shadow-elevation-1">
                                        <p className="text-primary font-bold text-xs">{transaction.timestamp}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
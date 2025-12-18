import React, { useCallback, useEffect, useState } from "react";
import { BrowserProvider, Contract, formatEther, parseEther, isAddress } from "ethers";
import { contractABI, contractAddress, shortenAddress } from "../utils/constants";
import { Loader2 } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import Toast from "./Toast";

/**
 * Transactions component for interacting with the Ethereum blockchain.
 * Allows users to send ETH and view transaction history.
 * @returns {JSX.Element} The Transactions component JSX.
 */
const Transactions = () => {
    const [currentAccount, setCurrentAccount] = useState("");
    const [formData, setFormData] = useState({ addressTo: "", amount: "", keyword: "", message: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [networkPrefix, setNetworkPrefix] = useState("sepolia.");
    const [toast, setToast] = useState(null);

    const { ethereum } = window;

    useEffect(() => {
        let cancelled = false; // Fix Bug #8: Add cleanup flag
        if (ethereum) {
            ethereum.request({ method: 'eth_chainId' })
                .then(chainId => {
                    if (cancelled) return; // Fix Bug #8: Check cancellation
                    if (chainId === '0x1') setNetworkPrefix("");
                    else if (chainId === '0xaa36a7') setNetworkPrefix("sepolia.");
                    else if (chainId === '0x5') setNetworkPrefix("goerli.");
                })
                .catch(err => console.error("Failed to get chainId", err));
        }
        return () => { cancelled = true; }; // Fix Bug #8: Cleanup
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
     * @returns {Promise<void>}
     */
    const getAllTransactions = useCallback(async () => {
        try {
            if (!ethereum) {
                setToast({ message: "Please install MetaMask.", type: "error" });
                return;
            }
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
     * @returns {Promise<void>}
     */
    const connectWallet = useCallback(async () => {
        try {
            if (!ethereum) {
                setToast({ message: "Please install MetaMask.", type: "error" });
                return;
            }
            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
            setCurrentAccount(accounts[0]);
            setToast({ message: "Wallet connected successfully!", type: "success" });
        } catch (error) {
            console.error(error);
            setToast({ message: "Failed to connect wallet.", type: "error" });
        }
    }, [ethereum]);

    /**
     * Sends a transaction to the blockchain.
     */
    const sendTransaction = async () => {
        const { addressTo, amount, keyword, message } = formData;
        try {
            if (!ethereum) {
                setToast({ message: "Please install MetaMask.", type: "error" });
                return;
            }

            // Validate Ethereum address
            if (!isAddress(addressTo)) {
                setToast({ message: "Invalid Ethereum address.", type: "error" });
                return;
            }

            const contract = await createEthereumContract();
            if (!contract) return;

            let parsedAmount;
            try {
                parsedAmount = parseEther(amount);
                // Fix Bug #2: Compare BigInt with BigInt literal
                if (parsedAmount <= 0n) {
                    setToast({ message: "Amount must be greater than zero.", type: "error" });
                    return;
                }
            } catch {
                setToast({ message: "Invalid amount. Please enter a valid number.", type: "error" });
                return;
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
            setToast({ message: "Transaction pending...", type: "info", duration: 0 }); // Keep open until done

            await transactionHash.wait();
            setIsLoading(false);
            setToast({ message: "Transaction successful!", type: "success" });

            // Bug #13 Fix: Reload transactions instead of full page
            getAllTransactions();
        } catch (error) {
            console.error(error);
            setIsLoading(false);
            setToast({ message: `Transaction failed: ${error.message?.slice(0, 50)}...`, type: "error" });
        }
    };

    /**
     * Handles form input changes.
     */
    const handleChange = (e, name) => {
        setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
    };

    useEffect(() => {
        const init = async () => {
            try {
                if (!ethereum) return;

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ethereum]);
    // Fix Bug #3: getAllTransactions intentionally omitted to prevent infinite loop

    return (
        <div className="flex w-full justify-center items-center 2xl:px-20 gradient-bg-transactions">
            <div className="flex flex-col md:flex-row w-full justify-between items-start p-12 px-4">
                <div className="flex flex-1 justify-start items-start flex-col mf:mr-10">
                    <Motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl sm:text-5xl text-on-surface text-gradient py-1 font-bold"
                    >
                        Send Crypto <br /> across the world
                    </Motion.h1>
                    <Motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-left mt-5 text-on-surface-variant font-light md:w-9/12 w-11/12 text-base"
                    >
                        Explore the crypto world. Buy and sell cryptocurrencies on Krypto.
                    </Motion.p>
                    {!currentAccount && (
                        <Motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={connectWallet}
                            className="flex flex-row justify-center items-center my-5 bg-primary p-3 rounded-full cursor-pointer hover:bg-primary/90 transition shadow-lg"
                        >
                            <p className="text-on-primary text-base font-semibold">
                                Connect Wallet
                            </p>
                        </Motion.button>
                    )}

                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-5 sm:w-96 w-full flex flex-col justify-start items-center blue-glassmorphism bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-xl"
                    >
                        <input placeholder="Address To" name="addressTo" type="text" onChange={(e) => handleChange(e, "addressTo")} className="my-2 w-full rounded-lg p-2 outline-none bg-black/20 text-on-surface border border-white/10 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder-white/30" />
                        <input placeholder="Amount (ETH)" name="amount" type="number" onChange={(e) => handleChange(e, "amount")} className="my-2 w-full rounded-lg p-2 outline-none bg-black/20 text-on-surface border border-white/10 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder-white/30" />
                        <input placeholder="Keyword (Gif)" name="keyword" type="text" onChange={(e) => handleChange(e, "keyword")} className="my-2 w-full rounded-lg p-2 outline-none bg-black/20 text-on-surface border border-white/10 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder-white/30" />
                        <input placeholder="Enter Message" name="message" type="text" onChange={(e) => handleChange(e, "message")} className="my-2 w-full rounded-lg p-2 outline-none bg-black/20 text-on-surface border border-white/10 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder-white/30" />

                        <div className="h-[1px] w-full bg-white/10 my-2" />

                        {isLoading ? (
                            <Loader2 className="animate-spin text-primary w-8 h-8" />
                        ) : (
                            <Motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (!formData.addressTo || !formData.amount) return;
                                    sendTransaction();
                                }}
                                className="text-on-primary w-full mt-2 bg-primary hover:bg-primary/90 p-2 rounded-full cursor-pointer transition font-medium shadow-lg"
                            >
                                Send now
                            </Motion.button>
                        )}
                    </Motion.div>
                </div>

                <div className="flex flex-col flex-1 items-center justify-start w-full mf:mt-0 mt-10">
                    <h3 className="text-on-surface text-3xl text-center my-2 font-bold">
                        Latest Transactions
                    </h3>
                    <div className="flex flex-wrap justify-center items-center mt-10 w-full">
                        <AnimatePresence>
                            {[...transactions].reverse().map((transaction, i) => (
                                <Motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={i}
                                    className="bg-white/5 backdrop-blur-md m-4 flex flex-1
                                    2xl:min-w-[450px]
                                    2xl:max-w-[500px]
                                    sm:min-w-[270px]
                                    sm:max-w-[300px]
                                    min-w-full
                                    flex-col p-4 rounded-xl border border-white/10 hover:shadow-2xl transition-all"
                                >
                                    <div className="flex flex-col items-center w-full mt-3">
                                        <div className="display-flex justify-start w-full mb-6 p-2 text-on-surface-variant">
                                            <a href={`https://${networkPrefix}etherscan.io/address/${transaction.addressFrom}`} target="_blank" rel="noreferrer">
                                                <p className="text-sm truncate hover:text-primary transition-colors">From: {shortenAddress(transaction.addressFrom)}</p>
                                            </a>
                                            <a href={`https://${networkPrefix}etherscan.io/address/${transaction.addressTo}`} target="_blank" rel="noreferrer">
                                                <p className="text-sm truncate hover:text-primary transition-colors">To: {shortenAddress(transaction.addressTo)}</p>
                                            </a>
                                            <p className="text-sm font-semibold mt-1">Amount: {transaction.amount} ETH</p>
                                            {transaction.message && (
                                                <>
                                                    <br />
                                                    <p className="text-sm italic">"{transaction.message}"</p>
                                                </>
                                            )}
                                        </div>
                                        <div className="bg-black/30 p-2 px-4 w-max rounded-3xl -mt-5 shadow-lg border border-white/5">
                                            <p className="text-primary font-bold text-xs">{transaction.timestamp}</p>
                                        </div>
                                    </div>
                                </Motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                        duration={toast.duration}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Transactions;

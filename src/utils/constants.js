import abi from './Transactions.json';

/**
 * The address of the deployed Transactions smart contract.
 * @type {string}
 */
export const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

/**
 * The ABI (Application Binary Interface) of the Transactions smart contract.
 * @type {Array}
 */
export const contractABI = abi.abi;

/**
 * Shortens an Ethereum address for display purposes.
 * Returns the first 5 characters and the last 4 characters separated by ellipses.
 *
 * @param {string} address - The full Ethereum address.
 * @returns {string} The shortened address (e.g., "0x123...abcd").
 */
export const shortenAddress = (address) => `${address.slice(0, 5)}...${address.slice(address.length - 4)}`;

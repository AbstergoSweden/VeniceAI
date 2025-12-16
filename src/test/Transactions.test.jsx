import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Transactions from '../components/Transactions';
import { BrowserProvider, Contract } from 'ethers';

// Mock ethers
vi.mock('ethers', async () => {
    const actual = await vi.importActual('ethers');
    return {
        ...actual,
        BrowserProvider: vi.fn(),
        Contract: vi.fn(),
        isAddress: vi.fn((addr) => addr === '0xValidAddress'),
        parseEther: vi.fn((val) => {
            if (val === 'invalid') throw new Error('Invalid amount');
            return { toString: () => '1000000000000000000' }; // 1 ETH
        }),
        formatEther: vi.fn((val) => '1.0'),
    };
});

describe('Transactions Component', () => {
    let mockEthereum;
    let mockContract;
    let mockGetAllTransactions;
    let mockAddToBlockchain;

    beforeEach(() => {
        mockEthereum = {
            request: vi.fn(),
        };
        window.ethereum = mockEthereum;

        mockGetAllTransactions = vi.fn().mockResolvedValue([
            {
                receiver: '0xReceiver',
                sender: '0xSender',
                timestamp: '1620000000',
                message: 'Test message',
                keyword: 'Test keyword',
                amount: '1000000000000000000',
            }
        ]);

        mockAddToBlockchain = vi.fn().mockResolvedValue({
            wait: vi.fn().mockResolvedValue({}),
        });

        mockContract = {
            getAllTransactions: mockGetAllTransactions,
            addToBlockchain: mockAddToBlockchain,
        };

        // Mock BrowserProvider and Contract
        BrowserProvider.mockImplementation(() => ({
            getSigner: vi.fn().mockResolvedValue({}),
        }));

        Contract.mockImplementation(() => mockContract);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<Transactions />);
        expect(screen.getByText(/Send Crypto/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Address To')).toBeInTheDocument();
    });

    it('connects wallet', async () => {
        mockEthereum.request.mockResolvedValue(['0xAccount']);
        render(<Transactions />);

        const connectButton = screen.getByText('Connect Wallet');
        fireEvent.click(connectButton);

        await waitFor(() => {
            expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
        });
    });

    it('loads transactions on mount if account exists', async () => {
        mockEthereum.request.mockImplementation(({ method }) => {
            if (method === 'eth_accounts') return Promise.resolve(['0xAccount']);
            if (method === 'eth_chainId') return Promise.resolve('0xaa36a7');
            return Promise.resolve([]);
        });

        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByText('From: 0xSen...nder')).toBeInTheDocument();
        });
    });

    it('sends transaction', async () => {
        mockEthereum.request.mockImplementation(({ method }) => {
            if (method === 'eth_accounts') return Promise.resolve(['0xAccount']);
            if (method === 'eth_chainId') return Promise.resolve('0xaa36a7');
            if (method === 'eth_sendTransaction') return Promise.resolve('0xTxHash');
            return Promise.resolve([]);
        });

        render(<Transactions />);

        // Wait for initial load
        await waitFor(() => screen.getByPlaceholderText('Address To'));

        fireEvent.change(screen.getByPlaceholderText('Address To'), { target: { value: '0xValidAddress' } });
        fireEvent.change(screen.getByPlaceholderText('Amount (ETH)'), { target: { value: '1' } });
        fireEvent.change(screen.getByPlaceholderText('Keyword (Gif)'), { target: { value: 'keyword' } });
        fireEvent.change(screen.getByPlaceholderText('Enter Message'), { target: { value: 'message' } });

        const sendButton = screen.getByText('Send now');
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(mockAddToBlockchain).toHaveBeenCalled();
        });
    });

    it('handles invalid address', async () => {
        window.alert = vi.fn();
        mockEthereum.request.mockResolvedValue(['0xAccount']);

        render(<Transactions />);

        // Wait for initial load
        await waitFor(() => screen.getByPlaceholderText('Address To'));

        fireEvent.change(screen.getByPlaceholderText('Address To'), { target: { value: 'InvalidAddress' } });
        fireEvent.change(screen.getByPlaceholderText('Amount (ETH)'), { target: { value: '1' } });

        const sendButton = screen.getByText('Send now');
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Invalid Ethereum address.');
        });
    });
});

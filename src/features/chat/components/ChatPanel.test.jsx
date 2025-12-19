import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPanel from './ChatPanel';

describe('ChatPanel Component', () => {
    const mockSetChatHistory = vi.fn();
    const mockSetSystemPrompt = vi.fn();
    const mockCallVeniceChat = vi.fn();

    const defaultProps = {
        chatHistory: [],
        setChatHistory: mockSetChatHistory,
        systemPrompt: '',
        setSystemPrompt: mockSetSystemPrompt,
        memoryLimit: 20,
        callVeniceChat: mockCallVeniceChat,
        defaultChatModel: 'test-model'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<ChatPanel {...defaultProps} />);
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
        expect(screen.getByText('System Prompt')).toBeInTheDocument();
    });

    it('updates system prompt', () => {
        render(<ChatPanel {...defaultProps} />);
        const textarea = screen.getByPlaceholderText('Enter system instruction for the assistant...');
        fireEvent.change(textarea, { target: { value: 'New system prompt' } });
        expect(mockSetSystemPrompt).toHaveBeenCalledWith('New system prompt');
    });

    it('sends a message', async () => {
        mockCallVeniceChat.mockResolvedValue('Response from AI');
        render(<ChatPanel {...defaultProps} />);

        const input = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(input, { target: { value: 'Hello' } });

        const sendButton = screen.getByLabelText('Send message');
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(mockCallVeniceChat).toHaveBeenCalled();
        });

        // Check if setChatHistory is called correctly
        // We expect it to be called with a function updater
        expect(mockSetChatHistory).toHaveBeenCalled();
    });

    it('handles API error', async () => {
        mockCallVeniceChat.mockRejectedValue(new Error('API Error'));
        render(<ChatPanel {...defaultProps} />);

        const input = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(input, { target: { value: 'Hello' } });

        const sendButton = screen.getByLabelText('Send message');
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(mockCallVeniceChat).toHaveBeenCalled();
        });

        expect(mockSetChatHistory).toHaveBeenCalled();
    });

    it('displays chat history', () => {
        const history = [
            { role: 'user', content: 'User message' },
            { role: 'assistant', content: 'AI message' }
        ];
        render(<ChatPanel {...defaultProps} chatHistory={history} />);

        expect(screen.getByText('User message')).toBeInTheDocument();
        expect(screen.getByText('AI message')).toBeInTheDocument();
    });

    it('loads system prompt from localStorage on mount', () => {
        const savedPrompt = 'Saved system prompt';
        // Mock getItem to return our saved prompt
        const getItemSpy = vi.spyOn(window.localStorage, 'getItem').mockReturnValue(savedPrompt);

        render(<ChatPanel {...defaultProps} systemPrompt="" />);
        expect(mockSetSystemPrompt).toHaveBeenCalledWith(savedPrompt);
        getItemSpy.mockRestore();
    });

    it('saves system prompt to localStorage on change', () => {
        const setItemSpy = vi.spyOn(window.localStorage, 'setItem');
        render(<ChatPanel {...defaultProps} systemPrompt="New Prompt" />);
        expect(setItemSpy).toHaveBeenCalledWith('venice-system-prompt', 'New Prompt');
        setItemSpy.mockRestore();
    });

    it('displays empty state when history is empty', () => {
        render(<ChatPanel {...defaultProps} chatHistory={[]} />);
        expect(screen.getByText('Start a conversation by typing a message below.')).toBeInTheDocument();
    });

    it('enforces memory limit', async () => {
        mockCallVeniceChat.mockResolvedValue('Response');
        // Arrange history with (limit) messages
        const limit = 2; // small limit for testing
        const initialHistory = [
            { role: 'user', content: '1' },
            { role: 'assistant', content: '2' }
        ];

        // We need to mock the implementation of setChatHistory to simulate state update logic
        // But since we can't easily capture the functional update in a simple mock, 
        // we can test the logic by inspecting the call arguments if possible, 
        // OR we can rely on the component implementation logic which we can't fully replicate without a real state or a more complex test.
        // However, we can test that the component passes the correct limit to logic if applicable, 
        // OR simply trust the integration test. 
        // Better: Render the component, trigger a send, and verify setChatHistory is called.
        // Actually, enforcing memory limit is logic inside handleSend's setState updater. 
        // To test it, we'd need to mock setChatHistory to execute the updater.

        let lastUpdater;
        mockSetChatHistory.mockImplementation((updater) => {
            lastUpdater = updater;
        });

        render(<ChatPanel {...defaultProps} chatHistory={initialHistory} memoryLimit={limit} />);

        const input = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(input, { target: { value: '3' } });
        fireEvent.click(screen.getByLabelText('Send message'));

        await waitFor(() => expect(mockCallVeniceChat).toHaveBeenCalled());

        // Execute valid updater
        const result = lastUpdater(initialHistory);
        // Should have added user msg (3) and AI msg (Response) -> total 4 messages.
        // Limit is 2. Should keep last 2.
        expect(result).toHaveLength(limit);
        expect(result[result.length - 1].content).toBe('Response');
    });

    it('handles Enter key to send message', async () => {
        render(<ChatPanel {...defaultProps} />);
        const input = screen.getByPlaceholderText('Type a message...');

        fireEvent.change(input, { target: { value: 'test message' } });
        fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

        await waitFor(() => {
            expect(mockCallVeniceChat).toHaveBeenCalled();
        });
    });

    it('handles Shift+Enter to insert newline (does not send)', async () => {
        render(<ChatPanel {...defaultProps} />);
        const input = screen.getByPlaceholderText('Type a message...');

        fireEvent.change(input, { target: { value: 'test message' } });
        fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

        // Should NOT call API
        expect(mockCallVeniceChat).not.toHaveBeenCalled();
    });
});

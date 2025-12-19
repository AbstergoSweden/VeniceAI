import { describe, it, expect, vi } from 'vitest';
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
});

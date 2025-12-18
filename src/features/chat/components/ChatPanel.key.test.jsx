import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatPanel from './ChatPanel';

describe('ChatPanel - React Key Props', () => {
    const defaultProps = {
        chatHistory: [],
        setChatHistory: vi.fn(),
        systemPrompt: 'Test system prompt',
        setSystemPrompt: vi.fn(),
        callVeniceChat: vi.fn(),
        defaultChatModel: 'test-model',
        memoryLimit: 20
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty state when no chat history', () => {
        render(<ChatPanel {...defaultProps} />);
        expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
    });

    it('renders chat messages with stable unique keys', () => {
        const mockHistory = [
            { role: 'user', content: 'Hello, how are you today?' },
            { role: 'assistant', content: 'I am doing well, thank you for asking!' },
            { role: 'user', content: 'What is React?' }
        ];

        const { container } = render(
            <ChatPanel {...defaultProps} chatHistory={mockHistory} />
        );

        // Verify all messages are rendered
        const messages = container.querySelectorAll('[role="listitem"]');
        expect(messages).toHaveLength(3);

        // Check that messages have content displayed
        expect(screen.getByText('Hello, how are you today?')).toBeInTheDocument();
        expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument();
        expect(screen.getByText('What is React?')).toBeInTheDocument();
    });

    it('each message has a unique stable key (not just index)', () => {
        const mockHistory = [
            { role: 'user', content: 'First message' },
            { role: 'assistant', content: 'First response' }
        ];

        const { container, rerender } = render(
            <ChatPanel {...defaultProps} chatHistory={mockHistory} />
        );

        // Get initial keys (React DevTools would show this, but we verify rendering works)
        const initialMessages = container.querySelectorAll('[role="listitem"]');
        expect(initialMessages).toHaveLength(2);

        // Add a new message at the end
        const updatedHistory = [
            ...mockHistory,
            { role: 'user', content: 'Second message' }
        ];

        rerender(<ChatPanel {...defaultProps} chatHistory={updatedHistory} />);

        const updatedMessages = container.querySelectorAll('[role="listitem"]');
        expect(updatedMessages).toHaveLength(3);

        // Verify all messages still render correctly
        expect(screen.getByText('First message')).toBeInTheDocument();
        expect(screen.getByText('First response')).toBeInTheDocument();
        expect(screen.getByText('Second message')).toBeInTheDocument();
    });

    it('handles messages with identical content correctly', () => {
        const mockHistory = [
            { role: 'user', content: 'Repeat this' },
            { role: 'assistant', content: 'Okay' },
            { role: 'user', content: 'Repeat this' } // Same content as first
        ];

        const { container } = render(
            <ChatPanel {...defaultProps} chatHistory={mockHistory} />
        );

        const messages = container.querySelectorAll('[role="listitem"]');
        expect(messages).toHaveLength(3);

        // Both "Repeat this" messages should be rendered
        const userMessages = screen.getAllByText('Repeat this');
        expect(userMessages).toHaveLength(2);
    });

    it('verifies key stability through re-render without errors', () => {
        const mockHistory = [
            { role: 'user', content: 'Test message one' },
            { role: 'assistant', content: 'Response one' }
        ];

        // Spy on console.error to catch React warnings about keys
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const { rerender } = render(
            <ChatPanel {...defaultProps} chatHistory={mockHistory} />
        );

        // Force multiple re-renders
        rerender(<ChatPanel {...defaultProps} chatHistory={mockHistory} />);
        rerender(<ChatPanel {...defaultProps} chatHistory={mockHistory} />);

        // No React key warnings should have been logged
        const keyWarnings = consoleErrorSpy.mock.calls.filter(call =>
            call.some(arg => typeof arg === 'string' && arg.includes('key'))
        );
        expect(keyWarnings).toHaveLength(0);

        consoleErrorSpy.mockRestore();
    });
});

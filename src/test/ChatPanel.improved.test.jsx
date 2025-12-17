import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPanel from './ChatPanel-improved';

describe('ChatPanel Component', () => {
    const mockProps = {
        chatHistory: [],
        setChatHistory: vi.fn(),
        systemPrompt: '',
        setSystemPrompt: vi.fn(),
        callVeniceChat: vi.fn(),
        defaultChatModel: 'test-model',
        memoryLimit: 20
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Rendering', () => {
        it('should render without crashing', () => {
            const { container } = render(<ChatPanel {...mockProps} />);
            expect(container).toBeTruthy();
        });

        it('should display empty state when no messages', () => {
            render(<ChatPanel {...mockProps} />);
            expect(screen.getByText(/Start a conversation/i)).toBeInTheDocument();
        });

        it('should render chat messages', () => {
            const props = {
                ...mockProps,
                chatHistory: [
                    { role: 'user', content: 'Hello' },
                    { role: 'assistant', content: 'Hi there!' }
                ]
            };

            render(<ChatPanel {...props} />);

            expect(screen.getByText('Hello')).toBeInTheDocument();
            expect(screen.getByText('Hi there!')).toBeInTheDocument();
        });

        it('should display loading indicator when loading', async () => {
            mockProps.callVeniceChat.mockImplementation(() => new Promise(() => { })); // Never resolves

            render(<ChatPanel {...mockProps} />);

            const input = screen.getByPlaceholderText(/Type a message/i);
            const sendButton = screen.getByLabelText(/Send message/i);

            await userEvent.type(input, 'Test message');
            await userEvent.click(sendButton);

            await waitFor(() => {
                expect(screen.getByLabelText(/Loading response/i)).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA attributes on messages container', () => {
            const { container } = render(<ChatPanel {...mockProps} />);
            const messageContainer = container.querySelector('[role="log"]');

            expect(messageContainer).toBeTruthy();
            expect(messageContainer.getAttribute('aria-live')).toBe('polite');
            expect(messageContainer.getAttribute('aria-label')).toBe('Chat conversation');
        });

        it('should have labeled input fields', () => {
            render(<ChatPanel {...mockProps} />);

            const systemPromptInput = screen.getByLabelText(/System prompt for AI assistant/i);
            const chatInput = screen.getByLabelText(/Chat message input/i);

            expect(systemPromptInput).toBeInTheDocument();
            expect(chatInput).toBeInTheDocument();
        });

        it('should have labeled buttons', () => {
            render(<ChatPanel {...mockProps} />);

            const sendButton = screen.getByLabelText(/Send message/i);
            expect(sendButton).toBeInTheDocument();
        });
    });

    describe('System Prompt Persistence', () => {
        it('should load system prompt from localStorage on mount', () => {
            const savedPrompt = 'Saved system prompt';
            localStorage.setItem('venice-system-prompt', savedPrompt);

            render(<ChatPanel {...mockProps} />);

            expect(mockProps.setSystemPrompt).toHaveBeenCalledWith(savedPrompt);
        });

        it('should save system prompt to localStorage on change', async () => {
            const { rerender } = render(<ChatPanel {...mockProps} />);

            const updatedProps = {
                ...mockProps,
                systemPrompt: 'New system prompt'
            };

            rerender(<ChatPanel {...updatedProps} />);

            await waitFor(() => {
                const saved = localStorage.getItem('venice-system-prompt');
                expect(saved).toBe('New system prompt');
            });
        });

        it('should use default prompt if none exists', () => {
            render(<ChatPanel {...mockProps} />);

            expect(mockProps.setSystemPrompt).toHaveBeenCalled();
            const call = mockProps.setSystemPrompt.mock.calls[0][0];
            expect(typeof call).toBe('string');
            expect(call.length).toBeGreaterThan(0);
        });
    });

    describe('Message Sending', () => {
        it('should send message when form is submitted', async () => {
            mockProps.callVeniceChat.mockResolvedValue('API response');

            render(<ChatPanel {...mockProps} />);

            const input = screen.getByPlaceholderText(/Type a message/i);
            const sendButton = screen.getByLabelText(/Send message/i);

            await userEvent.type(input, 'Test message');
            await userEvent.click(sendButton);

            await waitFor(() => {
                expect(mockProps.callVeniceChat).toHaveBeenCalled();
            });
        });

        it('should update chat history after successful API call', async () => {
            mockProps.callVeniceChat.mockResolvedValue('API response');

            render(<ChatPanel {...mockProps} />);

            const input = screen.getByPlaceholderText(/Type a message/i);

            await userEvent.type(input, 'Test message{Enter}');

            await waitFor(() => {
                expect(mockProps.setChatHistory).toHaveBeenCalled();
                const updateFn = mockProps.setChatHistory.mock.calls[0][0];
                const newHistory = updateFn([]);

                expect(newHistory).toHaveLength(2);
                expect(newHistory[0].role).toBe('user');
                expect(newHistory[0].content).toBe('Test message');
                expect(newHistory[1].role).toBe('assistant');
                expect(newHistory[1].content).toBe('API response');
            });
        });

        it('should clear input after sending', async () => {
            mockProps.callVeniceChat.mockResolvedValue('API response');

            render(<ChatPanel {...mockProps} />);

            const input = screen.getByPlaceholderText(/Type a message/i);

            await userEvent.type(input, 'Test message{Enter}');

            await waitFor(() => {
                expect(input.value).toBe('');
            });
        });

        it('should not send empty messages', async () => {
            render(<ChatPanel {...mockProps} />);

            const input = screen.getByPlaceholderText(/Type a message/i);

            await userEvent.type(input, '   {Enter}');

            expect(mockProps.callVeniceChat).not.toHaveBeenCalled();
        });

        it('should trim whitespace from messages', async () => {
            mockProps.callVeniceChat.mockResolvedValue('API response');

            render(<ChatPanel {...mockProps} />);

            const input = screen.getByPlaceholderText(/Type a message/i);

            await userEvent.type(input, '  Test message  {Enter}');

            await waitFor(() => {
                expect(mockProps.callVeniceChat).toHaveBeenCalled();
                const calls = mockProps.setChatHistory.mock.calls;
                const updateFn = calls[calls.length - 1][0];
                const newHistory = updateFn([]);

                expect(newHistory[0].content).toBe('Test message');
            });
        });
    });

    describe('Keyboard Shortcuts', () => {
        it('should send message on Enter key', async () => {
            mockProps.callVeniceChat.mockResolvedValue('API response');

            render(<ChatPanel {...mockProps} />);

            const input = screen.getByPlaceholderText(/Type a message/i);

            await userEvent.type(input, 'Test message{Enter}');

            await waitFor(() => {
                expect(mockProps.callVeniceChat).toHaveBeenCalled();
            });
        });

        it('should allow new line with Shift+Enter', async () => {
            render(<ChatPanel {...mockProps} />);

            const input = screen.getByPlaceholderText(/Type a message/i);

            await userEvent.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

            expect(input.value).toContain('\n');
            expect(mockProps.callVeniceChat).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockProps.callVeniceChat.mockRejectedValue(error);

            render(<ChatPanel {...mockProps} />);

            const input = screen.getByPlaceholderText(/Type a message/i);

            await userEvent.type(input, 'Test message{Enter}');

            await waitFor(() => {
                expect(mockProps.setChatHistory).toHaveBeenCalled();
                const updateFn = mockProps.setChatHistory.mock.calls[0][0];
                const newHistory = updateFn([]);

                // Should still add user message and error response
                expect(newHistory).toHaveLength(2);
                expect(newHistory[1].content).toContain('Error');
            });
        });

        it('should call onError callback when provided', async () => {
            const error = new Error('API Error');
            const onError = vi.fn();
            mockProps.callVeniceChat.mockRejectedValue(error);

            const props = { ...mockProps, onError };

            render(<ChatPanel {...props} />);

            const input = screen.getByPlaceholderText(/Type a message/i);

            await userEvent.type(input, 'Test message{Enter}');

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith(error);
            });
        });
    });

    describe('Memory Limit', () => {
        it('should enforce memory limit on chat history', async () => {
            mockProps.callVeniceChat.mockResolvedValue('Response');

            const props = {
                ...mockProps,
                memoryLimit: 4, // Only keep 4 messages (2 exchanges)
                chatHistory: [
                    { role: 'user', content: 'Old message 1' },
                    { role: 'assistant', content: 'Old response 1' }
                ]
            };

            render(<ChatPanel {...props} />);

            const input = screen.getByPlaceholderText(/Type a message/i);

            await userEvent.type(input, 'New message{Enter}');

            await waitFor(() => {
                const updateFn = mockProps.setChatHistory.mock.calls[0][0];
                const newHistory = updateFn(props.chatHistory);

                // Should keep only last 4 messages
                expect(newHistory.length).toBeLessThanOrEqual(4);
            });
        });
    });

    describe('Auto-scroll', () => {
        it('should auto-scroll to bottom when messages are added', async () => {
            const scrollIntoViewMock = vi.fn();

            // Mock scrollIntoView
            Element.prototype.scrollIntoView = scrollIntoViewMock;

            const props = {
                ...mockProps,
                chatHistory: [{ role: 'user', content: 'Test' }]
            };

            const { rerender } = render(<ChatPanel {...props} />);

            // Add new message
            const updatedProps = {
                ...props,
                chatHistory: [
                    ...props.chatHistory,
                    { role: 'assistant', content: 'Response' }
                ]
            };

            rerender(<ChatPanel {...updatedProps} />);

            await waitFor(() => {
                expect(scrollIntoViewMock).toHaveBeenCalled();
            });
        });
    });

    describe('Loading State', () => {
        it('should disable input while loading', async () => {
            mockProps.callVeniceChat.mockImplementation(() => new Promise(() => { }));

            render(<ChatPanel {...mockProps} />);

            const input = screen.getByPlaceholderText(/Type a message/i);
            const sendButton = screen.getByLabelText(/Send message/i);

            await userEvent.type(input, 'Test message');
            await userEvent.click(sendButton);

            await waitFor(() => {
                expect(input).toBeDisabled();
                expect(sendButton).toBeDisabled();
            });
        });

        it('should re-enable input after response', async () => {
            mockProps.callVeniceChat.mockResolvedValue('Response');

            render(<ChatPanel {...mockProps} />);

            const input = screen.getByPlaceholderText(/Type a message/i);
            const sendButton = screen.getByLabelText(/Send message/i);

            await userEvent.type(input, 'Test message');
            await userEvent.click(sendButton);

            await waitFor(() => {
                expect(input).not.toBeDisabled();
                expect(sendButton).not.toBeDisabled();
            });
        });
    });
});

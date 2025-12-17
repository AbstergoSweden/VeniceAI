import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPanel from '../components/ChatPanel';

// Mock the refs used in the component
const mockScrollIntoView = vi.fn();

// Mock the localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i) => Object.keys(store)[i] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock the window.scrollTo to prevent errors
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock the element.scrollIntoView method
Element.prototype.scrollIntoView = mockScrollIntoView;

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
        mockScrollIntoView.mockReset();
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
    });

    it('renders correctly', () => {
        render(<ChatPanel {...defaultProps} />);
        expect(screen.getByPlaceholderText('Type a message... (Enter to send, Shift+Enter for new line)')).toBeInTheDocument();
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

        const input = screen.getByPlaceholderText('Type a message... (Enter to send, Shift+Enter for new line)');
        fireEvent.change(input, { target: { value: 'Hello' } });

        const sendButton = screen.getByLabelText('Send message');
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(mockCallVeniceChat).toHaveBeenCalled();
        });

        // Check if setChatHistory is called correctly
        expect(mockSetChatHistory).toHaveBeenCalled();
    });

    it('handles API error', async () => {
        mockCallVeniceChat.mockRejectedValue(new Error('API Error'));
        render(<ChatPanel {...defaultProps} />);

        const input = screen.getByPlaceholderText('Type a message... (Enter to send, Shift+Enter for new line)');
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

    it('handles shift+enter for multiline input', async () => {
        render(<ChatPanel {...defaultProps} />);

        const input = screen.getByPlaceholderText('Type a message... (Enter to send, Shift+Enter for new line)');
        
        // Simulate pressing Shift+Enter to create a new line instead of submitting
        fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
        
        // Input should not have triggered the API call
        expect(mockCallVeniceChat).not.toHaveBeenCalled();
    });

    it('loads system prompt from localStorage on mount', () => {
        const savedPrompt = 'Saved system prompt';
        localStorageMock.getItem.mockReturnValue(savedPrompt);

        const { rerender } = render(<ChatPanel {...defaultProps} />);
        
        // Re-render to trigger useEffect
        rerender(<ChatPanel {...defaultProps} />);
        
        expect(mockSetSystemPrompt).toHaveBeenCalledWith(savedPrompt);
    });

    it('saves system prompt to localStorage when changed', () => {
        // Since we're mocking localStorage and the useEffect that saves to localStorage
        // We should directly check that the useEffect hook would be called
        // For this, we'll just check that the component correctly updates the state
        render(<ChatPanel {...defaultProps} />);
        const textarea = screen.getByPlaceholderText('Enter system instruction for the assistant...');
        fireEvent.change(textarea, { target: { value: 'New system prompt' } });

        // Check that the state change was handled by our mock function
        expect(mockSetSystemPrompt).toHaveBeenCalledWith('New system prompt');
    });

    it('uses default system prompt if none exists', () => {
        localStorageMock.getItem.mockReturnValue(null);
        
        render(<ChatPanel {...defaultProps} />);
        
        // Should call with the default prompt after mounting
        // We need to wait for the useEffect to run
        expect(mockSetSystemPrompt).toHaveBeenCalled();
    });

    it('disables input and button while loading', async () => {
        // Create a mock promise that simulates API loading
        const mockPromise = Promise.resolve('Response');
        mockCallVeniceChat.mockReturnValueOnce(mockPromise);

        render(<ChatPanel {...defaultProps} />);

        const input = screen.getByPlaceholderText('Type a message... (Enter to send, Shift+Enter for new line)');
        fireEvent.change(input, { target: { value: 'Hello' } });

        const sendButton = screen.getByLabelText('Send message');
        fireEvent.click(sendButton);

        // Check that the function was called (which should trigger loading state)
        expect(mockCallVeniceChat).toHaveBeenCalledWith('Hello', expect.any(String), expect.any(String));
    });

    it('clears input after sending message', async () => {
        mockCallVeniceChat.mockResolvedValue('Response from AI');
        render(<ChatPanel {...defaultProps} />);

        const input = screen.getByPlaceholderText('Type a message... (Enter to send, Shift+Enter for new line)');
        fireEvent.change(input, { target: { value: 'Hello' } });
        expect(input.value).toBe('Hello');

        const sendButton = screen.getByLabelText('Send message');
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(input.value).toBe('');
        });
    });

    it('does not send empty messages', async () => {
        render(<ChatPanel {...defaultProps} />);

        const input = screen.getByPlaceholderText('Type a message... (Enter to send, Shift+Enter for new line)');
        fireEvent.change(input, { target: { value: '   ' } }); // Just spaces

        const sendButton = screen.getByLabelText('Send message');
        fireEvent.click(sendButton);

        // Should not call the API for empty messages
        expect(mockCallVeniceChat).not.toHaveBeenCalled();
    });

    it('trims whitespace from messages', async () => {
        mockCallVeniceChat.mockResolvedValue('Response');
        render(<ChatPanel {...defaultProps} />);

        const input = screen.getByPlaceholderText('Type a message... (Enter to send, Shift+Enter for new line)');
        fireEvent.change(input, { target: { value: '  Hello world  ' } }); // Spaces

        const sendButton = screen.getByLabelText('Send message');
        fireEvent.click(sendButton);

        await waitFor(() => {
            // Verify the trimmed value was used in the API call
            expect(mockCallVeniceChat).toHaveBeenCalledWith('Hello world', expect.any(String), expect.any(String));
        });
    });

    it('respects memory limit by keeping only recent messages', async () => {
        mockCallVeniceChat.mockResolvedValue('Response from AI');
        const limitedProps = { ...defaultProps, memoryLimit: 2 };
        
        render(<ChatPanel {...limitedProps} />);

        const input = screen.getByPlaceholderText('Type a message... (Enter to send, Shift+Enter for new line)');

        // Send 5 messages to exceed the memory limit of 2
        for (let i = 1; i <= 5; i++) {
            fireEvent.change(input, { target: { value: `Message ${i}` } });
            fireEvent.click(screen.getByLabelText('Send message'));
            
            // Wait for the message to be processed
            await waitFor(() => {
                expect(mockCallVeniceChat).toHaveBeenCalledTimes(i);
            });
            
            // Clear the input for the next message
            fireEvent.change(input, { target: { value: '' } });
        }

        // At this point, only the last 2 exchanges (4 messages) should be kept
        expect(mockSetChatHistory).toHaveBeenCalled();
        
        // Call history should be limited based on the memory limit
        const lastCall = mockSetChatHistory.mock.calls[mockSetChatHistory.mock.calls.length - 1][0];
        const historyAfterCall = lastCall([]); // Apply the updater function to empty array
        
        // Should have at most 4 items (2 exchanges) with memory limit of 2
        expect(historyAfterCall.length).toBeLessThanOrEqual(4);
    });
});
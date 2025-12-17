import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Wand2 } from 'lucide-react';

const SYSTEM_PROMPT_KEY = 'venice-system-prompt';
const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant.';

/**
 * Component for displaying a single chat message.
 * @param {object} props - Component props.
 * @param {string} props.role - The role of the sender ('user' or 'assistant').
 * @param {string} props.content - The text content of the message.
 * @returns {JSX.Element} The rendered message bubble.
 */
const ChatMessage = ({ role, content }) => {
    const isUser = role === 'user';
    return (
        <div
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}
            role="listitem"
        >
            <div className={`max-w-[70%] p-3 rounded-xl ${isUser ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'} shadow-elevation-1`}>
                <p className="text-sm leading-relaxed">{content}</p>
            </div>
        </div>
    );
};

/**
 * Component for editing the system prompt.
 * @param {object} props - Component props.
 * @param {string} props.systemPrompt - The current system prompt.
 * @param {function} props.setSystemPrompt - Function to update the system prompt.
 * @returns {JSX.Element} The system prompt editor.
 */
const ChatSystemPrompt = ({ systemPrompt, setSystemPrompt }) => (
    <div className="p-4 border-b border-outline-variant bg-surface-container-low">
        <label
            className="block text-sm font-medium text-on-surface-variant mb-1"
            htmlFor="system-prompt-input"
        >
            System Prompt
        </label>
        <textarea
            id="system-prompt-input"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={2}
            className="m3-textfield w-full resize-none"
            placeholder="Enter system instruction for the assistant..."
            aria-label="System prompt for AI assistant"
        />
    </div>
);

/**
 * Component for chat input.
 * @param {object} props - Component props.
 * @param {function} props.onSend - Function to call when message is sent.
 * @param {boolean} props.disabled - Whether the input is disabled.
 * @returns {JSX.Element} The input form.
 */
const ChatInput = ({ onSend, disabled }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSend(input.trim());
        setInput('');
    };

    const handleKeyDown = (e) => {
        // Submit on Enter, allow Shift+Enter for new line
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex items-center p-4 border-t border-outline-variant bg-surface-container-low"
        >
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={disabled}
                className="m3-textfield flex-1 resize-none mr-2"
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                aria-label="Chat message input"
            />
            <button
                type="submit"
                disabled={disabled || !input.trim()}
                aria-label="Send message"
                className="m3-button-filled flex items-center justify-center p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send className="w-4 h-4" />
            </button>
        </form>
    );
};

/**
 * Main ChatPanel component.
 * Manages chat history, system prompt, and interactions with the chat API.
 *
 * @param {object} props - Component props.
 * @param {Array<{role: string, content: string}>} props.chatHistory - Array of chat message objects.
 * @param {function} props.setChatHistory - Function to update chat history.
 * @param {string} props.systemPrompt - The system prompt string.
 * @param {function} props.setSystemPrompt - Function to update system prompt.
 * @param {number} [props.memoryLimit=20] - Max number of messages to keep in history.
 * @param {function} props.callVeniceChat - Function to call the API.
 * @param {string} props.defaultChatModel - Default model ID.
 * @param {function} [props.onError] - Optional error callback.
 * @returns {JSX.Element} The complete chat panel.
 */
const ChatPanel = ({
    chatHistory,
    setChatHistory,
    systemPrompt,
    setSystemPrompt,
    memoryLimit = 20,
    callVeniceChat,
    defaultChatModel,
    onError
}) => {
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Load system prompt from localStorage on mount
    useEffect(() => {
        const savedPrompt = localStorage.getItem(SYSTEM_PROMPT_KEY);
        if (savedPrompt && !systemPrompt) {
            setSystemPrompt(savedPrompt);
        } else if (!systemPrompt && !savedPrompt) {
            setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
        }
    }, [systemPrompt, setSystemPrompt]);

    // Persist system prompt to localStorage
    useEffect(() => {
        if (systemPrompt) {
            localStorage.setItem(SYSTEM_PROMPT_KEY, systemPrompt);
        }
    }, [systemPrompt]);

    // Auto-scroll to bottom when chat history changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSend = async (userMessage) => {
        if (!userMessage.trim()) return;

        setLoading(true);
        try {
            // Build context from current history (before adding new message to avoid race condition)
            const conversationHistory = chatHistory.length > 0
                ? chatHistory.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')
                : '';

            const fullMessage = conversationHistory
                ? `${conversationHistory}\nUser: ${userMessage}`
                : userMessage;

            const response = await callVeniceChat(fullMessage, systemPrompt, defaultChatModel);

            // Add both messages after successful API call (atomic update)
            setChatHistory(prev => {
                const newHistory = [
                    ...prev,
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: response }
                ];
                // Enforce memory limit (keep last N messages)
                if (newHistory.length > memoryLimit) {
                    return newHistory.slice(newHistory.length - memoryLimit);
                }
                return newHistory;
            });
        } catch (err) {
            console.error('Chat error:', err);

            // Call error callback if provided
            if (typeof onError === 'function') {
                onError(err);
            }

            // On error, still add user message and error response
            setChatHistory(prev => {
                const newHistory = [
                    ...prev,
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: `Error: ${err.message}` }
                ];
                if (newHistory.length > memoryLimit) {
                    return newHistory.slice(newHistory.length - memoryLimit);
                }
                return newHistory;
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="m3-surface flex flex-col h-full">
            <ChatSystemPrompt systemPrompt={systemPrompt} setSystemPrompt={setSystemPrompt} />
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-2"
                role="log"
                aria-live="polite"
                aria-label="Chat conversation"
                aria-atomic="false"
            >
                {chatHistory.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-on-surface-variant text-sm">
                        <p>Start a conversation by typing a message below.</p>
                    </div>
                ) : (
                    chatHistory.map((msg, idx) => (
                        <ChatMessage key={idx} role={msg.role} content={msg.content} />
                    ))
                )}
                {loading && (
                    <div className="flex justify-center p-2">
                        <Wand2 className="animate-spin text-primary" aria-label="Loading response" />
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <ChatInput onSend={handleSend} disabled={loading} />
        </div>
    );
};

export default ChatPanel;

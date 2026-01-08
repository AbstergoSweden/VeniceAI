import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Wand2 } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Skeleton from '../../../components/ui/Skeleton';
import { setContentGuardBypass, getContentGuardBypass } from '../../../utils/contentGuard';

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
        <Motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
            role="listitem"
        >
            <Motion.div
                whileHover={{ scale: 1.01 }}
                className={`max-w-[75%] p-4 rounded-2xl backdrop-blur-md shadow-lg border border-white/5 ${isUser
                    ? 'bg-primary/90 text-on-primary rounded-tr-sm'
                    : 'bg-surface-container-high/80 text-on-surface rounded-tl-sm'
                    }`}
            >
                <p className="text-[15px] leading-7 tracking-wide font-normal">{content}</p>
            </Motion.div>
        </Motion.div>
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
    <Motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm"
    >
        <label
            className="block text-xs font-semibold text-on-surface-variant/80 uppercase tracking-wider mb-2"
            htmlFor="system-prompt-input"
        >
            System Prompt
        </label>
        <textarea
            id="system-prompt-input"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none placeholder-white/30"
            placeholder="Enter system instruction for the assistant..."
            aria-label="System prompt for AI assistant"
        />
    </Motion.div>
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
            className="flex items-center p-4 border-t border-white/10 bg-white/5 backdrop-blur-lg"
        >
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={disabled}
                className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 mr-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none placeholder-white/30"
                placeholder="Type a message..."
                aria-label="Chat message input"
            />
            <Motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={disabled || !input.trim()}
                aria-label="Send message"
                className="bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Send className="w-5 h-5" />
            </Motion.button>
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Fix Bug #4: Only run on mount to prevent infinite loop

    // Persist system prompt to localStorage
    useEffect(() => {
        if (systemPrompt) {
            localStorage.setItem(SYSTEM_PROMPT_KEY, systemPrompt);
        }
    }, [systemPrompt]);

    // Auto-scroll to bottom when chat history changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, loading]);

    const handleSend = async (userMessage) => {
        if (!userMessage.trim()) return;

        // DEV MODE COMMAND INTERCEPTION
        if (userMessage.trim() === '/devmode') {
            const currentState = getContentGuardBypass();
            setContentGuardBypass(!currentState);
            const newState = !currentState;

            setChatHistory(prev => [
                ...prev,
                { role: 'user', content: '/devmode' },
                { role: 'assistant', content: `🛡️ **Content Guard Dev Mode**: ${newState ? 'ENABLED (Bypass Active)' : 'DISABLED (Guard Active)'}` }
            ]);
            return;
        }

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
        <div className="relative flex flex-col h-full bg-surface/50 backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl border border-white/5">
            <ChatSystemPrompt systemPrompt={systemPrompt} setSystemPrompt={setSystemPrompt} />
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
                role="log"
                aria-live="polite"
                aria-label="Chat conversation"
                aria-atomic="false"
            >
                <AnimatePresence>
                    {chatHistory.length === 0 ? (
                        <Motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-full text-on-surface-variant/70 text-sm space-y-4"
                        >
                            <Wand2 className="w-12 h-12 opacity-20" />
                            <p>Start a conversation by typing a message below.</p>
                        </Motion.div>
                    ) : (
                        chatHistory.map((msg, idx) => {
                            // Use composite key for stability: index + role + content hash
                            // This prevents React reconciliation issues when messages update
                            const contentHash = msg.content.substring(0, 20).replace(/\s/g, '_');
                            const stableKey = `${idx}-${msg.role}-${contentHash}`;
                            return <ChatMessage key={stableKey} role={msg.role} content={msg.content} />;
                        })
                    )}
                </AnimatePresence>

                {loading && (
                    <Motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-start mb-4"
                    >
                        <div className="bg-surface-container-high/50 p-4 rounded-2xl rounded-tl-sm backdrop-blur-sm border border-white/5">
                            <div className="flex space-x-2">
                                <Skeleton className="w-2 h-2 rounded-full bg-primary/40" />
                                <Skeleton className="w-2 h-2 rounded-full bg-primary/40 delay-75" />
                                <Skeleton className="w-2 h-2 rounded-full bg-primary/40 delay-150" />
                            </div>
                        </div>
                    </Motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <ChatInput onSend={handleSend} disabled={loading} />
        </div>
    );
};

export default ChatPanel;

import React, { useState } from 'react';
import { X, Send, Wand2 } from 'lucide-react';

/**
 * Component for displaying a single chat message.
 * @param {object} props - Component props.
 * @param {string} props.role - The role of the sender ('user' or 'assistant').
 * @param {string} props.content - The text content of the message.
 */
const ChatMessage = ({ role, content }) => {
    const isUser = role === 'user';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
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
 */
const ChatSystemPrompt = ({ systemPrompt, setSystemPrompt }) => (
    <div className="p-4 border-b border-outline-variant bg-surface-container-low">
        <label className="block text-sm font-medium text-on-surface-variant mb-1">System Prompt</label>
        <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={2}
            className="m3-textfield w-full resize-none"
            placeholder="Enter system instruction for the assistant..."
        />
    </div>
);

/**
 * Component for chat input.
 * @param {object} props - Component props.
 * @param {function} props.onSend - Function to call when message is sent.
 * @param {boolean} props.disabled - Whether the input is disabled.
 */
const ChatInput = ({ onSend, disabled }) => {
    const [input, setInput] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSend(input.trim());
        setInput('');
    };
    return (
        <form onSubmit={handleSubmit} className="flex items-center p-4 border-t border-outline-variant bg-surface-container-low">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                disabled={disabled}
                className="m3-textfield flex-1 resize-none mr-2"
                placeholder="Type a message..."
            />
            <button type="submit" disabled={disabled} aria-label="Send" className="m3-button-filled flex items-center justify-center p-2">
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
 * @param {Array} props.chatHistory - Array of chat message objects.
 * @param {function} props.setChatHistory - Function to update chat history.
 * @param {string} props.systemPrompt - The system prompt string.
 * @param {function} props.setSystemPrompt - Function to update system prompt.
 * @param {number} [props.memoryLimit=20] - Max number of messages to keep in history.
 * @param {function} props.callVeniceChat - Function to call the API.
 * @param {string} props.defaultChatModel - Default model ID.
 */
const ChatPanel = ({ chatHistory, setChatHistory, systemPrompt, setSystemPrompt, memoryLimit = 20, callVeniceChat, defaultChatModel }) => {
    const [loading, setLoading] = useState(false);

    const handleSend = async (userMessage) => {
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
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {chatHistory.map((msg, idx) => (
                    <ChatMessage key={idx} role={msg.role} content={msg.content} />
                ))}
                {loading && (
                    <div className="flex justify-center p-2">
                        <Wand2 className="animate-spin text-primary" />
                    </div>
                )}
            </div>
            <ChatInput onSend={handleSend} disabled={loading} />
        </div>
    );
};

export default ChatPanel;

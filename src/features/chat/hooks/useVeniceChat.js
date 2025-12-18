import { useState } from 'react';
import { apiCall } from '../../../utils/api';
import { CONFIG } from '../../../utils/config';
import { DEFAULT_CHAT_MODELS } from '../../../utils/modelSync';

const DEFAULT_MODEL = DEFAULT_CHAT_MODELS[0]?.id || 'mistral-31-24b';

/**
 * Custom hook for interacting with Venice Chat API.
 */
export const useVeniceChat = () => {
    const [loading, setLoading] = useState(false);

    /**
     * Calls the Venice Chat API.
     * @param {string} userMessage - The user's message.
     * @param {string} [systemPrompt='You are a helpful assistant'] - The system prompt.
     * @param {string} [modelId] - The model ID to use.
     * @param {string|null} [imageBase64=null] - Base64 string of an image to send (if vision capable).
     * @returns {Promise<string>} The response content.
     */
    const callVeniceChat = async (userMessage, systemPrompt = 'You are a helpful assistant', modelId = DEFAULT_MODEL, imageBase64 = null) => {
        setLoading(true);
        try {
            // Build messages array
            const messages = [
                { role: "system", content: systemPrompt }
            ];

            // Add user message with optional image
            if (imageBase64) {
                messages.push({
                    role: "user",
                    content: [
                        { type: "text", text: userMessage },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
                    ]
                });
            } else {
                messages.push({ role: "user", content: userMessage });
            }

            // Call Venice Chat API using OpenAI-compatible format
            const response = await apiCall(`${CONFIG.BASE_API_URL}/chat/completions`, {
                model: modelId,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            }, CONFIG);

            const content = response.choices?.[0]?.message?.content;
            if (!content) throw new Error("No response from Venice Chat API");

            return content.trim();
        } catch (err) {
            console.error("Venice Chat API error:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { loading, callVeniceChat };
};

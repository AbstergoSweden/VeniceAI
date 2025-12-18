import { useState } from 'react';
import { useVeniceChat } from '../../chat/hooks/useVeniceChat';
import { DEFAULT_CHAT_MODELS } from '../../../utils/modelSync';

const VENICE_SYSTEM_PROMPT = `You are an expert prompt engineer specializing in creating highly detailed, evocative prompts for AI image generation (Midjourney, Stable Diffusion, DALL-E, etc.).

Your task is to transform user input into a single, powerful image generation prompt that maximizes visual quality and creative impact.

ANALYSIS PHASE:
- Identify the core subject/concept
- Determine mood, atmosphere, and emotional tone
- Assess level of abstraction and complexity
- Note any specific style preferences

OUTPUT REQUIREMENTS:
- Create ONE comprehensive prompt (not a conversation)
- Include vivid sensory details (lighting, textures, colors, atmosphere)
- Add technical quality markers (4K, highly detailed, professional photography, etc.)
- Incorporate artistic style references when appropriate
- Keep under 200 words but maximize descriptive density
- DO NOT include command prefixes like "/imagine prompt:" - just the prompt itself
- DO NOT ask questions or have a conversation - output the prompt directly

ENHANCEMENT GUIDELINES:
- For simple inputs: expand with relevant details, mood, and technical specs
- For existing prompts: refine, add depth, improve coherence
- Always maintain the user's original intent
- Prioritize visual richness and specificity

Return ONLY the enhanced prompt text, nothing else.`;

/**
 * Custom hook for prompt enhancement and image description features.
 * 
 * @param {object} params
 * @param {function} params.showToast - Function to show toast notifications
 * @param {function} params.setPrompt - State setter for the prompt
 * @param {string} params.prompt - Current prompt value
 * @param {Array} [params.chatModels] - List of available chat models (for vision)
 * @returns {object} Enhancement handlers and state
 */
export const usePromptEnhancement = ({
    showToast,
    setPrompt,
    prompt,
    chatModels = DEFAULT_CHAT_MODELS
}) => {
    const { loading: promptLoading, callVeniceChat } = useVeniceChat();

    // Image Description Modal State
    const [describeModalOpen, setDescribeModalOpen] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [imageDescription, setImageDescription] = useState('');
    const [describingImage, setDescribingImage] = useState(false);

    /**
     * Handles generating a prompt suggestion based on a user idea.
     */
    const handleSuggest = async () => {
        const idea = window.prompt("Enter a simple idea (e.g., 'a cyberpunk city'):");
        if (!idea) return;
        try {
            const result = await callVeniceChat(`Create a detailed image generation prompt based on this idea: "${idea}"`, VENICE_SYSTEM_PROMPT);
            setPrompt(result);
            showToast('Prompt suggestion generated!', 'success');
        } catch (e) {
            showToast("Failed to suggest prompt: " + e.message, 'error');
        }
    };

    /**
     * Handles enhancing the current prompt.
     */
    const handleEnhancePrompt = async () => {
        if (!prompt) {
            alert("Please enter a prompt first.");
            return;
        }
        try {
            const result = await callVeniceChat(`Enhance and improve this image generation prompt: "${prompt}"`, VENICE_SYSTEM_PROMPT);
            setPrompt(result);
            showToast('Prompt enhanced!', 'success');
        } catch (e) {
            showToast("Failed to enhance prompt: " + e.message, 'error');
        }
    };

    /**
     * Handles image upload for description.
     * @param {Event} e - The file input change event.
     */
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Please upload an image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result.split(',')[1];
            setUploadedImage(base64);
            setImageDescription('');
        };
        reader.readAsDataURL(file);
    };

    /**
     * Generates a description for the uploaded image.
     */
    const handleDescribeImage = async () => {
        if (!uploadedImage) return;

        setDescribingImage(true);
        try {
            // Use a vision-capable model
            const visionModel = chatModels.find(m => m.vision)?.id || DEFAULT_CHAT_MODELS[0]?.id || 'mistral-31-24b';

            const description = await callVeniceChat(
                "Describe this image in detail, focusing on elements that would be useful for creating a similar image with AI. Include details about subjects, composition, lighting, color palette, mood, and artistic style.",
                VENICE_SYSTEM_PROMPT,
                visionModel,
                uploadedImage
            );

            setImageDescription(description);
            showToast('Image described successfully!', 'success');
        } catch (e) {
            showToast("Failed to describe image: " + e.message, 'error');
        } finally {
            setDescribingImage(false);
        }
    };

    /**
     * Uses the generated image description as the main prompt.
     */
    const handleUseDescription = () => {
        if (imageDescription) {
            setPrompt(imageDescription);
            setDescribeModalOpen(false);
            setUploadedImage(null);
            setImageDescription('');
            showToast('Description inserted into prompt!', 'success');
        }
    };

    return {
        promptLoading: promptLoading || describingImage,
        describeModalOpen,
        setDescribeModalOpen,
        uploadedImage,
        setUploadedImage,
        imageDescription,
        setImageDescription,
        describingImage,
        handleSuggest,
        handleEnhancePrompt,
        handleImageUpload,
        handleDescribeImage,
        handleUseDescription
    };
};

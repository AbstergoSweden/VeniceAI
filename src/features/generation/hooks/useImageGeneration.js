import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { apiCall } from '../../../utils/api';
import { compressImage } from '../../../utils/image';

import { CONFIG } from '../../../utils/config';

/**
 * Custom hook for handling image generation logic.
 * 
 * @param {object} params
 * @param {object} params.user - Current user object
 * @param {string} params.appId - Application ID for Firestore path
 * @param {object} params.db - Firestore instance
 * @param {function} params.showToast - Toast notification function
 * @param {function} params.setHistory - State setter for history (optimistic updates)
 * @returns {object} { generating, error, statusMessage, handleGenerate }
 */
export const useImageGeneration = ({
    user,
    appId,
    db,
    showToast,
    setHistory
}) => {
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');

    /**
     * Handles the image generation process.
     * @param {Event} e - Form submission event
     * @param {object} formState - Current form values
     */
    const handleGenerate = async (e, formState) => {
        if (e) e.preventDefault();

        const {
            selectedModel,
            prompt,
            negativePrompt,
            steps,
            variants,
            seed,
            aspectRatio,
            hideWatermark,
            safeMode,
            selectedStyle
        } = formState;

        // Validation
        if (!selectedModel) {
            showToast('Please select a model before generating.', 'error');
            return;
        }

        const stepsNum = parseInt(steps, 10);
        const variantsNum = parseInt(variants, 10);

        if (isNaN(stepsNum) || stepsNum < 10) {
            showToast('Steps must be a number >= 10.', 'error');
            return;
        }
        if (isNaN(variantsNum) || variantsNum < 1) {
            showToast('Variants must be a number >= 1.', 'error');
            return;
        }

        if (!user) {
            alert("You must be signed in.");
            return;
        }
        if (!prompt || !prompt.trim()) {
            alert("Prompt cannot be empty");
            return;
        }

        setGenerating(true);
        setError(null);
        setStatusMessage("Initializing generation...");

        const baseSeed = seed ? parseInt(seed, 10) : Math.floor(Math.random() * 1000000000);

        // Calculate dimensions
        let width = 1024, height = 1024;
        if (aspectRatio === 'tall') { width = 768; height = 1024; }
        if (aspectRatio === 'wide') { width = 1024; height = 768; }

        try {
            const promises = [];
            for (let i = 0; i < variantsNum; i++) {
                const currentSeed = baseSeed + i;
                const requestData = {
                    model: selectedModel,
                    prompt,
                    negative_prompt: negativePrompt,
                    width, height,
                    steps: parseInt(steps),
                    hide_watermark: hideWatermark,
                    safe_mode: safeMode,
                    seed: currentSeed,
                    format: "png", // API returns base64 inside JSON
                    embed_exif_metadata: false,
                    ...(selectedStyle !== 'none' && { style_preset: selectedStyle })
                };

                // Include the index to properly correlate the response with the request
                const p = apiCall(`${CONFIG.BASE_API_URL}/image/generate`, requestData, CONFIG)
                    .then(async (result) => {
                        setStatusMessage(`Compressing image ${i + 1}...`);

                        if (!result.images || !result.images[0]) {
                            throw new Error("No image data received from API");
                        }

                        const compressed = await compressImage(result.images[0]);

                        const itemToSave = {
                            base64: compressed,
                            // Ensure the correct seed is preserved
                            params: { ...requestData, seed: currentSeed, timestamp: Date.now() }
                        };

                        const collectionPath = `artifacts/${appId}/users/${user.uid}/${CONFIG.COLLECTION_NAME}`;

                        try {
                            // Store with the correct document reference
                            await addDoc(collection(db, ...collectionPath.split('/')), itemToSave);
                        } catch (dbErr) {
                            console.warn("Failed to save to firestore", dbErr);
                            // We still want to show it in ephemeral state if we could
                            // Add a temporary ID that includes the seed for proper identification
                            const tempId = `offline-${Date.now()}-${currentSeed}`;
                            setHistory(prev => [{ ...itemToSave, id: tempId }, ...prev]);
                        }

                        // Return the result with its index to ensure proper ordering if needed
                        return { index: i, item: itemToSave, success: true };
                    })
                    .catch(error => {
                        // Return error with index to identify which variant failed
                        return { index: i, error, success: false };
                    });

                promises.push(p);
            }
            const results = await Promise.allSettled(promises);

            // Process results and check for failures
            const successful = results
                .filter(r => r.status === 'fulfilled' && r.value.success)
                .map(r => r.value);

            const failed = results
                .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
                .map(r => r.status === 'rejected' ? { reason: r.reason } : { reason: r.value.error });

            if (successful.length === 0 && failed.length > 0) {
                throw failed[0].reason || new Error("All image generations failed");
            }

            if (failed.length > 0) {
                console.warn("Some generations failed:", failed);
                setStatusMessage(`Generation complete! (${successful.length}/${variantsNum} successful)`);
            } else {
                setStatusMessage("Generation complete!");
            }
        } catch (err) {
            console.error("Generation error:", err);
            let msg = err.message || "Generation failed.";

            // Handle 402 Payment Required specifically for premium models
            if (msg.includes("402") || msg.toLowerCase().includes("payment")) {
                msg = `The model "${selectedModel}" requires a premium subscription (Error 402). Please select a different model (e.g., Fluently XL).`;
            }

            // Mock fallback if API keys fail completely (for demo purposes if keys are dead)
            if (msg.includes("API keys failed")) {
                setError("API Keys Invalid or Quota Exceeded. Switching to Demo Mode (Mock).");
                await new Promise(r => setTimeout(r, 2000));

                // Create a fake image (blue gradient placeholder)
                // Minimal placeholder base64
                const mockBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

                for (let i = 0; i < variantsNum; i++) {
                    const currentSeed = baseSeed + i;
                    const mockItem = {
                        base64: mockBase64,
                        params: {
                            prompt,
                            seed: currentSeed,
                            model: selectedModel,
                            timestamp: Date.now()
                        }
                    };
                    const tempId = `mock-${Date.now()}-${currentSeed}`;
                    setHistory(prev => [{ ...mockItem, id: tempId }, ...prev]);
                }
                setStatusMessage("Created mock images (Demo Mode)");
                return;
            }

            setError(msg);
            showToast(msg, 'error');
        } finally {
            setGenerating(false);
        }
    };

    return {
        generating,
        error,
        statusMessage,
        handleGenerate
    };
};

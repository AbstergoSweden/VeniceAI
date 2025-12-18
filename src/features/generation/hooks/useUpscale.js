import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { apiCall } from '../../../utils/api';
import { CONFIG } from '../../../utils/config';
import { compressImage } from '../../../utils/image';

/**
 * Custom hook for handling image upscaling and enhancement logic.
 * 
 * @param {object} params
 * @param {object} params.user - Current user object
 * @param {string} params.appId - Application ID for Firestore path
 * @param {object} params.db - Firestore instance
 * @param {function} params.showToast - Toast notification function
 * @returns {object} Upscale state and handlers
 */
export const useUpscale = ({
    user,
    appId,
    db,
    showToast
}) => {
    // Enhancement/Upscale State
    const [open, setOpen] = useState(false);
    const [target, setTarget] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [creativity, setCreativity] = useState(0.5);
    const [upscaling, setUpscaling] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState(null);

    /**
     * Opens the enhancement modal for a selected image.
     * @param {object} item - The history item to enhance.
     */
    const handleOpenEnhance = (item) => {
        setTarget(item);
        setPrompt(''); // Optional: prefill with original prompt if desired
        setCreativity(0.5);
        setOpen(true);
    };

    /**
     * Submits the image enhancement request.
     * @param {Event} e - Form submission event.
     */
    const handleEnhance = async (e) => {
        if (e) e.preventDefault();
        if (!target) return;

        setUpscaling(true);
        setOpen(false); // Close modal
        setStatus("Enhancing image...");
        setError(null);

        try {
            const requestData = {
                image: target.base64,
                scale: 1, // Usually implies upscale, but maybe just enhancement here (img2img)
                enhance: true,
                enhanceCreativity: parseFloat(creativity),
                enhancePrompt: prompt
            };

            // Using 'true' for isBinary response
            const response = await apiCall(`${CONFIG.BASE_API_URL}/image/upscale`, requestData, CONFIG, 0, true);
            const blob = new Blob([response], { type: 'image/png' });

            // Convert blob to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const newBase64 = reader.result.split(',')[1];
                    const compressed = await compressImage(newBase64);

                    // Validate Firestore document ID before attempting update
                    if (!target.id || target.id.startsWith('mock-') || target.id.startsWith('offline-')) {
                        showToast('Cannot enhance offline/mock images. Please generate online first.', 'error');
                        setUpscaling(false);
                        return;
                    }

                    const collectionPath = `artifacts/${appId}/users/${user.uid}/${CONFIG.COLLECTION_NAME}`;
                    const docRef = doc(db, ...collectionPath.split('/'), target.id);

                    await updateDoc(docRef, {
                        base64: compressed,
                        'params.enhanced': true,
                        'params.enhancementPrompt': prompt,
                        'params.lastEnhanced': Date.now()
                    });

                    setUpscaling(false);
                    setStatus("Enhancement saved!");
                    showToast("Image enhanced successfully!", "success");

                } catch (innerErr) {
                    setUpscaling(false);
                    setError("Enhancement failed: " + innerErr.message);
                    showToast("Enhancement processing failed: " + innerErr.message, "error");
                }
            };
            reader.readAsDataURL(blob);

        } catch (err) {
            setUpscaling(false);
            setError("Enhancement failed: " + err.message);
            showToast("Enhancement request failed: " + err.message, "error");
        }
    };

    return {
        // Modal State
        enhanceModalOpen: open,
        setEnhanceModalOpen: setOpen,
        enhanceTarget: target,
        enhancePrompt: prompt,
        setEnhancePrompt: setPrompt,
        enhanceCreativity: creativity,
        setEnhanceCreativity: setCreativity,

        // Processing State
        upscaling,
        upscaleStatus: status,
        upscaleError: error,

        // Handlers
        handleOpenEnhance,
        handleEnhance
    };
};

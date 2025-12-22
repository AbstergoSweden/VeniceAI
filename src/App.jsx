import React, { useState, useEffect, lazy, Suspense } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, writeBatch, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiCall } from './utils/api';

import imageCache from './utils/cache';
import { syncVeniceModels, DEFAULT_CHAT_MODELS } from './utils/modelSync';
import { motion as Motion } from 'framer-motion';
import { CONFIG } from './utils/config';
import { ToastProvider, useToast } from './components/ui/Toast';

import { useImageGeneration } from './features/generation/hooks/useImageGeneration';
import { usePromptEnhancement } from './features/generation/hooks/usePromptEnhancement';
import { useUpscale } from './features/generation/hooks/useUpscale';
import { useVeniceChat } from './features/chat/hooks/useVeniceChat';
import DescribeModal from './features/generation/components/DescribeModal';
import EnhanceModal from './features/generation/components/EnhanceModal';
import ControlPanel from './features/generation/components/ControlPanel';
import ImageGallery from './features/generation/components/ImageGallery';
import ErrorFallback from './components/ui/ErrorFallback';
import OfflineIndicator from './components/ui/OfflineIndicator';


/**
 * ErrorBoundary component to catch React errors and show fallback UI.
 * Logs errors in development and production for debugging.
 */
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Error info:', errorInfo);

        // Store error info for display
        this.setState({
            errorInfo
        });

        // In production, you could send this to an error reporting service
        if (!import.meta.env.DEV) {
            // Example: Sentry.captureException(error, { extra: errorInfo });
        }
    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <ErrorFallback
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                    resetError={this.resetError}
                />
            );
        }

        return this.props.children;
    }
}

// Lazy load heavy components
const ChatPanel = lazy(() => import('./features/chat/components/ChatPanel'));
const Transactions = lazy(() => import('./features/web3/components/Transactions'));

/**
 * Loading component for lazy-loaded components.
 */
const LoadingComponent = ({ message = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center p-8 text-on-surface-variant">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm font-medium">{message}</p>
    </div>
);


// --- CONFIGURATION ---
// Loaded from utils/config.js

const DEFAULT_CHAT_MODEL = DEFAULT_CHAT_MODELS[0]?.id || 'mistral-31-24b';

// --- FIREBASE INITIALIZATION ---
let firebaseConfig, appId;

if (typeof __firebase_config === 'undefined') {
    throw new Error("Firebase configuration is required but not provided. Please configure firebase in vite.config.js or build process.");
} else {
    try {
        firebaseConfig = typeof __firebase_config === 'string'
            ? JSON.parse(__firebase_config)
            : __firebase_config;
    } catch {
        throw new Error("Invalid Firebase configuration format. Please ensure __firebase_config contains valid JSON.");
    }
}

appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

let app, auth, db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Initialize App Check for production
    if (!import.meta.env.DEV) {
        try {
            initializeAppCheck(app, {
                provider: new ReCaptchaV3Provider(firebaseConfig.recaptchaSiteKey || 'DEFAULT_SITE_KEY'),
                isTokenAutoRefreshEnabled: true
            });
            console.log('[Security] App Check initialized');
        } catch (appCheckError) {
            console.warn('[Security] App Check initialization failed:', appCheckError);
        }
    } else {
        // In development, use debug token
        if (typeof self !== 'undefined') {
            self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN || true;
        }
        console.log('[Security] Running in development mode - App Check debug mode enabled');
    }
} catch (e) {
    console.error("Firebase initialization failed:", e);
    throw e;
}

const AppContent = () => {
    // --- STATE ---
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLimit, setHistoryLimit] = useState(50); // Pagination: initial limit
    const [hasMoreHistory, setHasMoreHistory] = useState(true);

    // Form State
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState(CONFIG.DEFAULT_NEGATIVE_PROMPT);
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('none');
    const [aspectRatio, setAspectRatio] = useState('square');
    const [steps, setSteps] = useState(30);
    const [variants, setVariants] = useState(1);
    const [seed] = useState('');
    const [hideWatermark, setHideWatermark] = useState(true);
    const [safeMode, setSafeMode] = useState(false);

    // Data Lists
    const [modelsList, setModelsList] = useState([]);
    const [stylesList, setStylesList] = useState([]);
    const [chatModels, setChatModels] = useState(DEFAULT_CHAT_MODELS);

    const { showToast } = useToast();

    // Chat Hook (for ChatPanel)
    const { callVeniceChat } = useVeniceChat();

    // Prompt Enhancement Hook
    const {
        promptLoading,
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
    } = usePromptEnhancement({
        showToast,
        setPrompt,
        prompt,
        chatModels
    });

    // Upscale Hook
    const {
        enhanceModalOpen,
        setEnhanceModalOpen,
        enhanceTarget,
        enhancePrompt,
        setEnhancePrompt,
        enhanceCreativity,
        setEnhanceCreativity,
        upscaling,
        upscaleStatus,
        upscaleError,
        handleOpenEnhance,
        handleEnhance
    } = useUpscale({ user, appId, db, showToast });

    // Hook for Image Generation Logic
    const {
        generating: isGenerating,
        error: generationError,
        statusMessage: generationStatus,
        handleGenerate: generateImage
    } = useImageGeneration({
        user,
        appId,
        db,
        showToast,
        setHistory
    });

    // Derived UI State
    const generating = isGenerating || upscaling;
    const error = generationError || upscaleError;
    const statusMessage = generationStatus || upscaleStatus;

    // --- EFFECTS ---

    // 1. Auth
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                    showToast('Authenticated successfully', 'success');
                } else {
                    await signInAnonymously(auth);
                    showToast('Running in demo mode - history may not persist', 'warning');
                }
            } catch (err) {
                console.error("Auth failed:", err);
                showToast("Authentication failed. Running in offline mode - history will not be saved.", 'warning');
                setUser({ uid: 'offline-user', isAnonymous: true, offline: true });
            }
        };
        initAuth();
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            if (authUser && !authUser.offline) {
                setUser(authUser);
            }
        });
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2. Fetch Models/Styles
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [modelsRes, stylesRes] = await Promise.all([
                    apiCall(`${CONFIG.BASE_API_URL}/models?type=image`, null, CONFIG),
                    apiCall(`${CONFIG.BASE_API_URL}/image/styles`, null, CONFIG)
                ]);

                if (modelsRes.data && modelsRes.data.length > 0) {
                    setModelsList(modelsRes.data);
                    setSelectedModel(modelsRes.data[0].id);
                    showToast(`Loaded ${modelsRes.data.length} models`, 'success');
                } else {
                    throw new Error("No models returned from API");
                }

                if (stylesRes.data) {
                    setStylesList(stylesRes.data);
                }
            } catch (e) {
                console.error("Failed to fetch models/styles", e);
                showToast("Could not load models from API. Using fallback model.", 'warning');
                setModelsList([{ id: "fluently-xl", name: "Fluently XL" }]);
                setSelectedModel("fluently-xl");
            }
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2b. Sync Chat Models
    useEffect(() => {
        const syncModels = async () => {
            if (CONFIG.API_KEYS.length === 0) {
                console.warn('[ModelSync] No API keys available, using defaults');
                return;
            }

            try {
                const models = await syncVeniceModels(CONFIG.API_KEYS[0], CONFIG.BASE_API_URL);
                setChatModels(models);
                if (import.meta.env.DEV) {
                    console.log(`[ModelSync] Loaded ${models.length} chat models`);
                }
            } catch (error) {
                console.error('[ModelSync] Failed to sync models:', error);
            }
        };
        syncModels();
    }, []);

    // 3. Firestore Listener with Pagination
    useEffect(() => {
        if (!user) return;
        if (user.offline || !navigator.onLine) {
            showToast("Running in offline mode - history is local only", 'info');
            return;
        }

        const collectionPath = `artifacts/${appId}/users/${user.uid}/${CONFIG.COLLECTION_NAME}`;

        try {
            // Query with limit for pagination
            const q = query(
                collection(db, ...collectionPath.split('/')),
                orderBy('params.timestamp', 'desc'),
                firestoreLimit(historyLimit)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHistory(items);

                // Check if there might be more items
                setHasMoreHistory(items.length === historyLimit);
            }, (err) => {
                console.warn("Firestore access denied or error:", err);
                showToast("Could not sync history from cloud. Using local storage only.", 'warning');
            });

            return () => unsubscribe();
        } catch (e) {
            console.warn("Firestore query error:", e);
            showToast("Firestore unavailable. History will be stored locally.", 'warning');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, historyLimit]);

    // --- LOGIC ---

    const handleGenerate = (e) => {
        generateImage(e, {
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
        });
    };

    const clearHistory = async () => {
        if (!window.confirm("Are you sure you want to delete all history?")) return;
        try {
            const collectionPath = `artifacts/${appId}/users/${user.uid}/${CONFIG.COLLECTION_NAME}`;
            const colRef = collection(db, ...collectionPath.split('/'));
            const snapshot = await getDocs(colRef);

            const CHUNK_SIZE = 500;
            const chunks = [];
            for (let i = 0; i < snapshot.docs.length; i += CHUNK_SIZE) {
                chunks.push(snapshot.docs.slice(i, i + CHUNK_SIZE));
            }

            for (const chunk of chunks) {
                const batch = writeBatch(db);
                chunk.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
            }
        } catch {
            setHistory([]);
        }
    };

    const [chatHistory, setChatHistory] = useState([]);
    const [systemPrompt, setSystemPrompt] = useState('');

    const downloadImage = (base64, seed) => {
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${base64}`;
        link.download = `venice_art_${seed}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const loadMoreHistory = () => {
        setHistoryLimit(prev => prev + 50);
        showToast(`Loading ${historyLimit + 50} total images...`, 'info');
    };

    return (
        <div className="min-h-screen bg-surface-dim text-on-surface font-sans selection:bg-primary selection:text-white">
            {/* Offline Indicator */}
            <OfflineIndicator />

            {/* Background Effects */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-container/40 via-surface-dim to-surface-dim pointer-events-none -z-20" />
            <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-20 pointer-events-none -z-10 mix-blend-overlay" />
            <div className="fixed inset-0 bg-gradient-to-t from-surface-dim via-transparent to-transparent pointer-events-none -z-10" />

            <div className="container mx-auto p-4 lg:p-8 max-w-[1600px]">
                {/* Header */}
                <Motion.header
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center mb-12 relative z-10"
                >
                    <div className="relative group mb-6">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-secondary to-tertiary blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
                        <Motion.img
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            src="https://preview.redd.it/73z6v668xffc1.jpeg?width=1055&format=pjpg&auto=webp&s=b15ae1f6d53d93bf004d8bbff24d5135026bbd2d"
                            alt="Venice.ai Logo"
                            className="relative w-24 h-24 max-w-[96px] rounded-3xl object-cover shadow-2xl border-2 border-white/10"
                        />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-300 to-tertiary tracking-tight text-center">
                        Venice Generator
                    </h1>
                    <p className="mt-4 text-on-surface-variant/80 text-sm font-medium tracking-wide border border-white/5 rounded-full px-4 py-1.5 bg-white/5 backdrop-blur-sm">
                        Uncensored • Private • High Fidelity
                    </p>
                </Motion.header>

                {/* Main Content Area */}
                <div className="flex flex-wrap gap-8 mb-12 w-full max-w-full lg:flex-nowrap">
                    {/* Left: Controls */}
                    <div className="w-full lg:w-80 xl:w-96 flex-none">
                        <ControlPanel
                            prompt={prompt}
                            onPromptChange={setPrompt}
                            negativePrompt={negativePrompt}
                            onNegativePromptChange={setNegativePrompt}
                            promptLoading={promptLoading}
                            onSuggest={handleSuggest}
                            onEnhance={handleEnhancePrompt}
                            onDescribe={() => setDescribeModalOpen(true)}
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                            modelsList={modelsList}
                            selectedStyle={selectedStyle}
                            onStyleChange={setSelectedStyle}
                            stylesList={stylesList}
                            steps={steps}
                            onStepsChange={setSteps}
                            variants={variants}
                            onVariantsChange={setVariants}
                            aspectRatio={aspectRatio}
                            onAspectRatioChange={setAspectRatio}
                            hideWatermark={hideWatermark}
                            onWatermarkChange={setHideWatermark}
                            safeMode={safeMode}
                            onSafeModeChange={setSafeMode}
                            generating={generating}
                            onGenerate={handleGenerate}
                            onClearHistory={clearHistory}
                            onClearCache={() => {
                                imageCache.cleanup(true);
                                showToast('Image cache cleared', 'info');
                            }}
                            onShowCacheStats={() => {
                                const stats = imageCache.getStats();
                                showToast(`Cache: ${stats.count} items, ${stats.size}`, 'info');
                            }}
                        />
                    </div>

                    {/* Right: Gallery */}
                    <Motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex-1 min-w-0 flex flex-col gap-6"
                    >
                        <div className="bg-surface/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6 min-h-[600px] shadow-xl relative overflow-hidden">
                            {/* Status Overlay */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-tertiary opacity-20" />

                            {error && (
                                <Motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 bg-error-container/20 border border-error/20 text-error-container p-4 rounded-xl flex items-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 text-error" />
                                    <span className="text-sm font-medium text-error">{error}</span>
                                </Motion.div>
                            )}

                            {generating && (
                                <Motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mb-8 flex flex-col items-center justify-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10"
                                >
                                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                    <p className="text-on-surface font-medium animate-pulse">{statusMessage}</p>
                                </Motion.div>
                            )}

                            <ImageGallery
                                images={history}
                                isGenerating={generating}
                                onDownload={downloadImage}
                                onEnhance={handleOpenEnhance}
                                onLoadMore={loadMoreHistory}
                                hasMore={hasMoreHistory}
                            />
                        </div>
                    </Motion.div>
                </div>

                {/* Chat Panel Section */}
                <div className="mb-12">
                    <Suspense fallback={
                        <div className="h-[600px] bg-surface/30 rounded-2xl flex items-center justify-center border border-white/5">
                            <LoadingComponent message="Loading chat interface..." />
                        </div>
                    }>
                        <div className="h-[700px]">
                            <ChatPanel
                                chatHistory={chatHistory}
                                setChatHistory={setChatHistory}
                                systemPrompt={systemPrompt}
                                setSystemPrompt={setSystemPrompt}
                                memoryLimit={20}
                                callVeniceChat={callVeniceChat}
                                defaultChatModel={DEFAULT_CHAT_MODEL}
                            />
                        </div>
                    </Suspense>
                </div>

                {/* Transactions Section */}
                <div className="mb-12">
                    <div className="bg-surface/30 backdrop-blur-xl border border-white/5 p-8 rounded-2xl shadow-xl">
                        <Suspense fallback={<LoadingComponent message="Loading transaction interface..." />}>
                            <Transactions />
                        </Suspense>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <EnhanceModal
                isOpen={enhanceModalOpen}
                onClose={() => setEnhanceModalOpen(false)}
                target={enhanceTarget}
                prompt={enhancePrompt}
                onPromptChange={setEnhancePrompt}
                creativity={enhanceCreativity}
                onCreativityChange={setEnhanceCreativity}
                onSubmit={handleEnhance}
            />

            <DescribeModal
                isOpen={describeModalOpen}
                onClose={() => {
                    setDescribeModalOpen(false);
                    setUploadedImage(null);
                    setImageDescription('');
                }}
                uploadedImage={uploadedImage}
                imageDescription={imageDescription}
                describingImage={describingImage}
                onImageUpload={handleImageUpload}
                onDescribe={handleDescribeImage}
                onUseDescription={handleUseDescription}
                onRemoveImage={() => {
                    setUploadedImage(null);
                    setImageDescription('');
                }}
            />
        </div>
    );
};

export default function App() {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
}

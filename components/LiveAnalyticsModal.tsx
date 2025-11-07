
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { LiveAnalyticsModalProps, ReportEvent, EventSeverity, Analytic } from '../types';
import * as api from '../services/api'; // Import the new API service

// Helper function to convert Blob to Base64 (still used for local frame extraction)
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]); // Extract base64 part
            } else {
                reject(new Error("Failed to read blob as string"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const LiveAnalyticsModal: React.FC<LiveAnalyticsModalProps> = ({ isOpen, onClose, camera, onAddEvent, analytics }) => {
    const [analysisRunning, setAnalysisRunning] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [currentFrameDescription, setCurrentFrameDescription] = useState<string | null>(null);
    const [analyzedFrameCount, setAnalyzedFrameCount] = useState(0);
    const [videoError, setVideoError] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const lastAnalysisTime = useRef(0);
    const analysisIntervalMs = 3000; // Analyze every 3 seconds

    // Reset state when modal opens/closes or camera changes
    useEffect(() => {
        if (!isOpen || !camera) {
            stopAnalysis();
            setAnalysisRunning(false);
            setStatusMessage('');
            setError(null);
            setCurrentFrameDescription(null);
            setAnalyzedFrameCount(0);
            setVideoError(false);
        }
    }, [isOpen, camera]);

    const generateRandomSeverity = useCallback((): EventSeverity => {
        const severities: EventSeverity[] = ['Low', 'Medium', 'High', 'Critical'];
        return severities[Math.floor(Math.random() * severities.length)];
    }, []);

    const extractFrame = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement): string => {
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error("Could not get 2D context from canvas");
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        return canvas.toDataURL('image/jpeg', 0.8); // Base64 encoded JPEG
    }, []);

    const processFrame = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !camera || !analysisRunning) {
            animationFrameId.current = null;
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const now = Date.now();

        if (now - lastAnalysisTime.current >= analysisIntervalMs && video.readyState >= 2) {
            lastAnalysisTime.current = now;
            setStatusMessage('Capturing frame for analysis...');

            try {
                const base64ImageDataUrl = extractFrame(video, canvas);
                const appliedAnalyticIds = analytics
                    .filter(a => camera.analyticIds.includes(a.id))
                    .map(a => a.id);
                
                setStatusMessage(`Sending frame ${analyzedFrameCount + 1} to Cloud Function for analysis...`);
                // Call the Cloud Function for live analysis
                const description = await api.analyzeLiveFrame(camera.id, base64ImageDataUrl, appliedAnalyticIds);
                setCurrentFrameDescription(description);
                setAnalyzedFrameCount(prev => prev + 1);

                // Optionally generate a report event based on description (simple heuristic for demo)
                if (description && (description.toLowerCase().includes('unusual') ||
                    description.toLowerCase().includes('alert') ||
                    description.toLowerCase().includes('intruder') ||
                    description.toLowerCase().includes('fire') ||
                    description.toLowerCase().includes('smoke'))) {
                    
                    const eventAnalytic = analytics.find(a => camera.analyticIds.includes(a.id)) || { name: 'General Anomaly', id: '0' }; // Use default ID for Analytic
                    
                    onAddEvent({
                        timestamp: new Date().toISOString(),
                        cameraName: camera.name,
                        analyticName: eventAnalytic.name,
                        severity: generateRandomSeverity(), // Assign random severity
                        videoUrl: camera.videoUrl, // Use camera's live stream URL as video clip
                        details: `Live analysis detected: ${description}`,
                    });
                }
                setStatusMessage('Analysis complete for current frame. Waiting for next interval...');

            } catch (err: any) {
                console.error("Live analysis processing error (via Cloud Function):", err);
                setError(err.message || "Failed to process live frame via Cloud Function.");
                setStatusMessage('Analysis stopped due to error.');
                stopAnalysis();
                return;
            }
        }

        animationFrameId.current = requestAnimationFrame(processFrame);
    }, [analysisRunning, camera, analyzedFrameCount, onAddEvent, extractFrame, generateRandomSeverity, analytics]);

    const startAnalysis = () => {
        if (!camera) {
            setError("No camera selected for live analysis.");
            return;
        }
        setAnalysisRunning(true);
        setError(null);
        setAnalyzedFrameCount(0);
        setCurrentFrameDescription(null);
        setStatusMessage('Starting live analysis...');
        lastAnalysisTime.current = Date.now();
        animationFrameId.current = requestAnimationFrame(processFrame);
    };

    const stopAnalysis = useCallback(() => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        setAnalysisRunning(false);
        setStatusMessage('Live analysis stopped.');
    }, []);

    // Effect to start/stop the animation frame loop
    useEffect(() => {
        if (analysisRunning) {
            animationFrameId.current = requestAnimationFrame(processFrame);
        } else if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [analysisRunning, processFrame]);

    if (!isOpen || !camera) return null;

    const appliedAnalytics = analytics.filter(analytic => camera.analyticIds.includes(analytic.id));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl transform transition-all flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">Live AI Analysis: {camera.name}</h2>
                        <p className="text-sm text-gray-400">{camera.location} - {camera.ipAddress}</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white text-3xl">&times;</button>
                </div>

                <div className="flex-grow p-4 overflow-hidden flex">
                    {/* Left Panel: Live Video Feed */}
                    <div className="w-2/3 pr-4 flex flex-col">
                        <div className="relative flex-grow bg-black rounded-md overflow-hidden">
                            {videoError ? (
                                <div className="w-full h-full flex flex-col justify-center items-center text-gray-400 text-sm bg-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Video Stream Not Available
                                    <span className="text-xs mt-1">(Check console for errors)</span>
                                </div>
                            ) : (
                                <video
                                    ref={videoRef}
                                    src={camera.videoUrl}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        setVideoError(true);
                                        const err = e.currentTarget.error;
                                        console.error(
                                            `Error loading video in LiveAnalyticsModal: ${camera.name}. ` +
                                            `Code: ${err?.code || 'N/A'}, ` +
                                            `Message: ${err?.message || 'N/A'}. ` +
                                            `URL: ${e.currentTarget.src}`
                                        );
                                        stopAnalysis(); // Stop analysis if video fails
                                    }}
                                />
                            )}
                            <canvas ref={canvasRef} className="hidden" /> {/* Hidden canvas for frame extraction */}
                        </div>

                        {error && (
                            <div className="bg-red-900 text-red-300 p-3 rounded-md mt-4">
                                <p className="text-sm">Error: {error}</p>
                            </div>
                        )}

                        <div className="mt-4 flex justify-between items-center">
                            {analysisRunning ? (
                                <button
                                    onClick={stopAnalysis}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
                                    Stop Analysis
                                </button>
                            ) : (
                                <button
                                    onClick={startAnalysis}
                                    disabled={videoError || error !== null} // Disable if video error or API key error
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    Start Live Analysis
                                </button>
                            )}
                            <span className="text-sm text-gray-400">{statusMessage}</span>
                        </div>
                    </div>

                    {/* Right Panel: Analysis Output */}
                    <div className="w-1/3 pl-4 flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-3">Analysis Output</h3>
                        <div className="bg-gray-700 p-3 rounded-md flex-grow overflow-y-auto">
                            {analysisRunning ? (
                                <>
                                    <p className="text-gray-400 text-sm mb-2">Analyzed Frames: {analyzedFrameCount}</p>
                                    {currentFrameDescription ? (
                                        <div className="bg-gray-600 p-3 rounded-md shadow-sm">
                                            <p className="text-xs font-semibold text-gray-300 mb-1">Latest Insight:</p>
                                            <p className="text-sm text-white">{currentFrameDescription}</p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm">Waiting for first analysis result...</p>
                                    )}
                                    <p className="text-gray-500 text-xs mt-4">
                                        Note: Events are generated based on identified patterns in the live stream.
                                    </p>
                                </>
                            ) : (
                                <p className="text-gray-400 text-sm">Start live analysis to see real-time insights from AI models.</p>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Applied Analytics</h4>
                            <div className="flex flex-wrap gap-2 items-center min-h-[28px]">
                                {appliedAnalytics.length > 0 ? appliedAnalytics.map(analytic => {
                                    const Icon = analytic.icon;
                                    return (
                                        <div key={analytic.id} className="group relative" title={analytic.name}>
                                            <div className="bg-gray-600 p-1.5 rounded-full">
                                                <Icon className="w-4 h-4 text-blue-300" />
                                            </div>
                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {analytic.name}
                                            </span>
                                        </div>
                                    );
                                }) : <p className="text-xs text-gray-500 italic">No analytics applied to this camera.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-900 rounded-b-lg text-right border-t border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { AnalyzeVideoModalProps, VideoAnalysisResult } from '../types';
import * as api from '../services/api'; // Import the new API service

// Helper functions for base64 encoding/decoding (still used for frame extraction locally)
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

export const AnalyzeVideoModal: React.FC<AnalyzeVideoModalProps> = ({ isOpen, onClose }) => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResults, setAnalysisResults] = useState<VideoAnalysisResult[]>([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0); // This will still track local frame processing
    const [error, setError] = useState<string | null>(null);
    const [processingMessage, setProcessingMessage] = useState<string>('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setVideoFile(null);
            setVideoUrl(null);
            setIsLoading(false);
            setAnalysisResults([]);
            setCurrentFrameIndex(0);
            setError(null);
            setProcessingMessage('');
        }
    }, [isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setVideoFile(file);
            setVideoUrl(URL.createObjectURL(file));
            setAnalysisResults([]);
            setCurrentFrameIndex(0);
            setError(null);
            setProcessingMessage('');
        }
    };

    // The logic to extract frame locally remains, as we'll send the entire video to CF
    // However, the current `callGeminiAPI` and frame-by-frame processing is removed.
    // Instead, the entire `videoFile` is sent to the Cloud Function.
    
    const handleAnalyzeVideo = async () => {
        if (!videoFile) {
            setError("Please upload a video file first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResults([]);
        setProcessingMessage('Uploading video and initializing analysis on backend...');

        try {
            // Call the Cloud Function to handle video analysis
            // The Cloud Function will upload to GCS, call Vertex AI Video Intelligence, and return results
            // Fix: Explicitly type the result from analyzeVideoFile to VideoAnalysisResult[]
            const results: VideoAnalysisResult[] = await api.analyzeVideoFile(videoFile);
            setAnalysisResults(results);
            setProcessingMessage('Video analysis complete.');
        } catch (err: any) {
            console.error("Video analysis failed:", err);
            setError(err.message || "An unexpected error occurred during video analysis. Check Cloud Function logs.");
            setProcessingMessage('Analysis interrupted due to error.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl transform transition-all flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Analyze Video File</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white text-3xl">&times;</button>
                </div>

                <div className="flex-grow p-4 overflow-hidden flex">
                    <div className="w-1/2 pr-4 flex flex-col">
                        <div className="mb-4">
                            <label htmlFor="video-upload" className="block text-sm font-medium text-gray-300 mb-2">Upload Video File</label>
                            <input
                                type="file"
                                id="video-upload"
                                accept="video/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-500 file:text-white
                                    hover:file:bg-blue-600"
                                disabled={isLoading}
                            />
                        </div>

                        {videoUrl && (
                            <div className="relative mb-4 flex-grow">
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    controls
                                    muted
                                    preload="metadata" // preload metadata for duration/dimensions
                                    className="w-full h-full object-contain rounded-md bg-black"
                                    onLoadedMetadata={() => {
                                        // Ensure canvas matches video dimensions initially
                                        if (videoRef.current && canvasRef.current) {
                                            canvasRef.current.width = videoRef.current.videoWidth;
                                            canvasRef.current.height = videoRef.current.videoHeight;
                                        }
                                    }}
                                />
                                <canvas ref={canvasRef} className="hidden" /> {/* Hidden canvas for frame extraction */}
                            </div>
                        )}

                        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                        <div className="flex items-center justify-between mt-auto">
                            <span className="text-sm text-gray-400">{processingMessage}</span>
                            <button
                                onClick={handleAnalyzeVideo}
                                disabled={!videoFile || isLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                )}
                                {isLoading ? `Analyzing...` : 'Start Analysis'}
                            </button>
                        </div>
                    </div>

                    <div className="w-1/2 pl-4 flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-3">Analysis Results</h3>
                        <div className="bg-gray-700 p-3 rounded-md flex-grow overflow-y-auto">
                            {analysisResults.length === 0 && !isLoading && !error && (
                                <p className="text-gray-400 text-sm">Upload a video and click "Start Analysis" to see results.</p>
                            )}
                            {analysisResults.map((result, index) => (
                                <div key={index} className="flex items-start mb-4 p-3 bg-gray-600 rounded-md shadow-sm">
                                    <img src={result.imageUrl} alt={`Frame ${result.frameNumber}`} className="w-24 h-24 object-cover rounded-md mr-4 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-semibold text-gray-300">Frame {result.frameNumber} ({result.timestamp.toFixed(1)}s)</p>
                                        <p className="text-sm text-white mt-1">{result.description}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && analysisResults.length > 0 && (
                                <p className="text-gray-400 text-sm animate-pulse">Continuing analysis...</p>
                            )}
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
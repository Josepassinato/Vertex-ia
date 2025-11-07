import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { AnalyzeVideoModalProps, VideoAnalysisResult } from '../types';
import * as api from '../services/api';

const MAX_FRAMES_TO_ANALYZE = 10; // Limit to 10 frames for a quick demo
const FRAME_CAPTURE_INTERVAL_SECONDS = 2; // Capture a frame every 2 seconds

export const AnalyzeVideoModal: React.FC<AnalyzeVideoModalProps> = ({ isOpen, onClose }) => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [analysisResults, setAnalysisResults] = useState<VideoAnalysisResult[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentFrameNum, setCurrentFrameNum] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const checkApiKeyAndOpenDialog = async () => {
      try {
        // Ensure window.aistudio exists and has the necessary functions
        if (typeof window.aistudio === 'undefined' || !window.aistudio.hasSelectedApiKey || !window.aistudio.openSelectKey) {
          console.warn("window.aistudio functions not available. Proceeding without explicit API key check/selection. Ensure process.env.API_KEY is set.");
          return true; // Assume API key is available via environment for standalone execution
        }

        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
          // Assume success after opening the dialog, handle actual API failures later
        }
        return true;
      } catch (e: any) {
        // Log the specific error for better debugging
        console.error("Error during API key check/selection:", e);
        if (e.message.includes("Requested entity was not found.")) {
          setError("API key invalid or not selected. Please select an API key.");
          if (typeof window.aistudio !== 'undefined' && window.aistudio.openSelectKey) {
             await window.aistudio.openSelectKey();
          }
        } else {
          setError(`Failed to check/select API key: ${e.message}`);
        }
        return false;
      }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setVideoFile(file);
            setVideoUrl(URL.createObjectURL(file));
            setAnalysisResults([]);
            setProgress(0);
            setCurrentFrameNum(0);
            setError(null);
            if (videoRef.current) {
                videoRef.current.load(); // Load the new video
            }
        }
    };

    const stopAnalysis = useCallback(() => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsAnalyzing(false);
        setProgress(0); // Reset progress on stop
        if (videoRef.current) {
            videoRef.current.pause(); // Ensure video is paused
        }
    }, []);

    const performAnalysis = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !videoFile) {
            setError("No video selected or video element not ready.");
            return;
        }

        const canAnalyze = await checkApiKeyAndOpenDialog();
        if (!canAnalyze) {
            setIsAnalyzing(false);
            return;
        }

        setIsAnalyzing(true);
        setAnalysisResults([]);
        setProgress(0);
        setCurrentFrameNum(0);
        setError(null);
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;

        const video = videoRef.current;
        video.currentTime = 0; // Start from the beginning
        video.pause();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError("Failed to get 2D context from canvas.");
            setIsAnalyzing(false);
            return;
        }

        const videoDuration = video.duration;
        let frameCount = 0;
        let lastCapturedTime = -FRAME_CAPTURE_INTERVAL_SECONDS; // Initialize to ensure first frame is captured at 0

        const captureFrame = async () => {
            if (signal.aborted || frameCount >= MAX_FRAMES_TO_ANALYZE) {
                stopAnalysis();
                return;
            }

            try {
                // Check if enough time has passed since the last capture
                if (video.currentTime >= lastCapturedTime + FRAME_CAPTURE_INTERVAL_SECONDS) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const base64Image = canvas.toDataURL('image/jpeg', 0.9).split(',')[1]; // Use 0.9 quality for JPEG
                    const timestamp = video.currentTime;

                    if (base64Image) {
                        let description = "Analysis failed for this frame.";
                        try {
                           description = await api.analyzeVideoFrame(base64Image);
                        } catch (apiError: any) {
                            console.error(`Gemini API error for frame ${frameCount + 1}:`, apiError);
                            // If API call fails, assume it's an API key issue or rate limit
                            if (apiError.message.includes("API key")) {
                                setError("Gemini API key is invalid or not set. Please select a valid key.");
                                stopAnalysis();
                                return;
                            }
                        }

                        setAnalysisResults(prev => [
                            ...prev,
                            { frameNumber: frameCount + 1, timestamp, imageUrl: `data:image/jpeg;base64,${base64Image}`, description }
                        ]);
                        lastCapturedTime = video.currentTime;
                        frameCount++;
                        setProgress((frameCount / MAX_FRAMES_TO_ANALYZE) * 100);
                        setCurrentFrameNum(frameCount);
                    }
                }

                if (frameCount < MAX_FRAMES_TO_ANALYZE && video.currentTime < videoDuration) {
                    // Continue playing if not enough frames captured or end of video not reached
                    animationFrameId.current = requestAnimationFrame(captureFrame);
                } else {
                    stopAnalysis();
                    if (frameCount === MAX_FRAMES_TO_ANALYZE) {
                        console.log("Maximum frames analyzed.");
                    } else {
                        console.log("End of video reached.");
                    }
                }
            } catch (err: any) {
                if (signal.aborted) {
                    console.log("Analysis aborted.");
                    return;
                }
                console.error("Error during frame capture or analysis:", err);
                setError(`Analysis failed: ${err.message || "Unknown error"}`);
                stopAnalysis();
            }
        };

        const onVideoMetadataLoaded = () => {
            if (video.readyState >= 2) { // HAVE_CURRENT_DATA
                video.removeEventListener('loadedmetadata', onVideoMetadataLoaded);
                video.play(); // Start playing to get frames
                animationFrameId.current = requestAnimationFrame(captureFrame);
            }
        };
        video.addEventListener('loadedmetadata', onVideoMetadataLoaded);
        video.play(); // Start loading and playing the video
    }, [videoFile, stopAnalysis]);

    useEffect(() => {
        if (!isOpen) {
            stopAnalysis();
            setVideoFile(null);
            setVideoUrl(null);
            setAnalysisResults([]);
            setProgress(0);
            setError(null);
        }
    }, [isOpen, stopAnalysis]);

    // Cleanup object URL when component unmounts or videoFile changes
    useEffect(() => {
        return () => {
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [videoUrl]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl transform transition-all flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white">Analyze Video with Gemini AI</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white text-3xl" aria-label="Close">&times;</button>
                </div>

                <div className="flex-grow p-4 overflow-y-auto">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="video-upload">Upload Video File</label>
                        <input
                            id="video-upload"
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-600 file:text-white
                                hover:file:bg-blue-700 disabled:opacity-50"
                            disabled={isAnalyzing}
                        />
                        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    </div>

                    {videoUrl && (
                        <div className="mb-4 flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    controls
                                    muted // Always muted to avoid autoplay issues
                                    playsInline
                                    className="w-full rounded-md max-h-[300px] object-contain bg-black"
                                    onLoadedMetadata={() => {
                                        if (videoRef.current && canvasRef.current) {
                                            canvasRef.current.width = videoRef.current.videoWidth;
                                            canvasRef.current.height = videoRef.current.videoHeight;
                                        }
                                    }}
                                />
                                {isAnalyzing && (
                                    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                                        <div className="text-center">
                                            {/* Loader spinner */}
                                            <div className="loader ease-linear rounded-full border-4 border-t-4 border-blue-500 border-gray-200 h-12 w-12 mb-4 mx-auto" />
                                            <p className="text-white">Analyzing frame {currentFrameNum} of {MAX_FRAMES_TO_ANALYZE}...</p>
                                            <div className="w-48 bg-gray-700 rounded-full h-2.5 mt-2 mx-auto">
                                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 hidden"> {/* Hidden canvas for frame capture */}
                                <canvas ref={canvasRef} />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end mt-4 space-x-4 flex-shrink-0">
                        {isAnalyzing ? (
                            <button
                                onClick={stopAnalysis}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                                disabled={!isAnalyzing}
                            >
                                Stop Analysis
                            </button>
                        ) : (
                            <button
                                onClick={performAnalysis}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                disabled={!videoFile || isAnalyzing}
                            >
                                Start Analysis
                            </button>
                        )}
                    </div>

                    {analysisResults.length > 0 && (
                        <div className="mt-8 pt-4 border-t border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4">Analysis Results</h3>
                            <div className="space-y-6">
                                {analysisResults.map((result, index) => (
                                    <div key={index} className="bg-gray-700 p-4 rounded-lg flex flex-col md:flex-row items-start md:items-center gap-4">
                                        <img src={result.imageUrl} alt={`Frame ${result.frameNumber}`} className="w-24 h-auto rounded-md flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-400">
                                                Frame {result.frameNumber} (at {result.timestamp.toFixed(2)}s)
                                            </p>
                                            <p className="text-white mt-1">{result.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-700 text-right flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import type { LivePreviewModalProps } from '../types';

export const LivePreviewModal: React.FC<LivePreviewModalProps> = ({ isOpen, onClose, camera }) => {
    const [videoError, setVideoError] = useState(false);

    useEffect(() => {
        setVideoError(false); // Reset error state when camera.videoUrl changes
    }, [camera?.videoUrl]);

    if (!isOpen || !camera) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">{camera.name}</h2>
                        <p className="text-sm text-gray-400">{camera.location}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 bg-red-900 text-red-300 px-3 py-1 rounded-full text-sm font-semibold">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <span>LIVE</span>
                        </div>
                        {/* Muted indicator */}
                        <div className="flex items-center space-x-1 bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm font-semibold">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 4L8 8H4C3.447 8 3 8.447 3 9V15C3 15.553 3.447 16 4 16H8L12 20V4Z" />
                                <path d="M16 11H18C18 9.176 17.164 7.647 16 7V9C16.553 9.765 16.895 10.353 17 11H16Z" />
                                <path d="M16 13C16.895 12.647 16.553 12.235 16 12V14C17.164 13.353 18 11.824 18 10H16V13Z" />
                            </svg>
                            <span>Muted</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-black">
                    {videoError ? (
                        <div className="w-full h-auto object-contain max-h-[70vh] min-h-[300px] rounded bg-gray-700 flex flex-col justify-center items-center text-gray-400 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Video Stream Not Available
                            <span className="text-xs mt-1">(Check console for errors)</span>
                        </div>
                    ) : (
                        <video 
                            src={camera.videoUrl} // Directly set src
                            className="w-full h-auto object-contain max-h-[70vh] rounded" 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            key={camera.videoUrl}
                            onError={(e) => {
                                setVideoError(true);
                                const error = e.currentTarget.error;
                                console.error(
                                    `Error loading video in LivePreviewModal: ${camera.name}. ` +
                                    `Code: ${error?.code || 'N/A'}, ` +
                                    `Message: ${error?.message || 'N/A'}. ` +
                                    `URL: ${e.currentTarget.src}` 
                                );
                            }}
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}
                </div>
                 <div className="p-4 bg-gray-800 rounded-b-lg text-right">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600">
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    );
};

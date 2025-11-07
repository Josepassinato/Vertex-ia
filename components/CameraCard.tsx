
import React, { useState, useEffect } from 'react';
import type { Camera } from '../types';
import { MOCK_ANALYTICS } from '../constants';

interface CameraCardProps {
    camera: Camera;
    onEdit: () => void;
    onDelete: () => void;
    onShowPreview: () => void;
}

const EditIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const DeleteIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.033c-1.12 0-2.033.954-2.033 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

const PlayIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
    </svg>
);


export const CameraCard: React.FC<CameraCardProps> = ({ camera, onEdit, onDelete, onShowPreview }) => {
    const [videoError, setVideoError] = useState(false);

    useEffect(() => {
        setVideoError(false); // Reset error state when camera.videoUrl changes
    }, [camera.videoUrl]);

    const statusClasses = {
        Online: { dot: 'bg-green-400', text: 'text-green-300' },
        Recording: { dot: 'bg-red-500 animate-pulse', text: 'text-red-400' },
        Offline: { dot: 'bg-gray-500', text: 'text-gray-400' },
    };

    const appliedAnalytics = MOCK_ANALYTICS.filter(analytic => camera.analyticIds.includes(analytic.id));

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-blue-500 border-2 border-transparent">
            <div className="relative group">
                {videoError ? (
                    <div className="w-full h-48 bg-gray-700 flex flex-col justify-center items-center text-gray-400 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Video Not Available
                        <span className="text-xs mt-1">(Check console for errors)</span>
                    </div>
                ) : (
                    <video 
                        className="w-full h-48 object-cover" 
                        src={camera.videoUrl} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        key={camera.videoUrl} // Add key to force re-render on src change
                        onError={(e) => {
                            setVideoError(true); // Set error state to true
                            const error = e.currentTarget.error;
                            console.error(
                                `Error loading video in CameraCard: ${camera.name}. ` +
                                `Code: ${error?.code || 'N/A'}, ` +
                                `Message: ${error?.message || 'N/A'}. ` +
                                `URL: ${e.currentTarget.src}` // Use e.currentTarget.src for accuracy
                            );
                        }}
                    >
                        Your browser does not support the video tag.
                    </video>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex justify-center items-center">
                    <button 
                        onClick={onShowPreview}
                        className="p-3 bg-blue-600 rounded-full text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300"
                        aria-label="Live Preview"
                    >
                        <PlayIcon />
                    </button>
                </div>
                {/* Muted indicator */}
                <div className="absolute bottom-3 left-3 bg-gray-900 bg-opacity-60 text-gray-300 text-xs px-2 py-1 rounded-full flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4L8 8H4C3.447 8 3 8.447 3 9V15C3 15.553 3.447 16 4 16H8L12 20V4Z" />
                        <path d="M16 11H18C18 9.176 17.164 7.647 16 7V9C16.553 9.765 16.895 10.353 17 11H16Z" />
                        <path d="M16 13C16.895 12.647 16.553 12.235 16 12V14C17.164 13.353 18 11.824 18 10H16V13Z" />
                    </svg>
                    Muted
                </div>
                <div className="absolute top-3 right-3 flex space-x-2">
                    <button onClick={onEdit} className="p-2 bg-gray-900 bg-opacity-60 rounded-full text-gray-300 hover:bg-opacity-80 hover:text-white transition-colors">
                        <EditIcon />
                    </button>
                    <button onClick={onDelete} className="p-2 bg-gray-900 bg-opacity-60 rounded-full text-gray-300 hover:bg-opacity-80 hover:text-white transition-colors">
                        <DeleteIcon />
                    </button>
                </div>
            </div>
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-white">{camera.name}</h3>
                        <p className="text-sm text-gray-400">{camera.location}</p>
                    </div>
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusClasses[camera.status].text}`}>
                        <span className={`w-2 h-2 mr-2 rounded-full ${statusClasses[camera.status].dot}`}></span>
                        {camera.status}
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 font-mono">{camera.ipAddress}</p>
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Active Analytics</h4>
                    <div className="flex flex-wrap gap-2 items-center min-h-[28px]">
                        {appliedAnalytics.length > 0 ? appliedAnalytics.map(analytic => {
                            const Icon = analytic.icon;
                            return (
                                <div key={analytic.id} className="group relative" title={analytic.name}>
                                    <div className="bg-gray-700 p-1.5 rounded-full">
                                        <Icon className="w-4 h-4 text-blue-300" />
                                    </div>
                                </div>
                            );
                        }) : <p className="text-xs text-gray-500 italic">No analytics applied.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
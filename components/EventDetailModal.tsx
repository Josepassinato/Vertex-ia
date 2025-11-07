
import React, { useState, useEffect } from 'react';
import type { EventDetailModalProps, ReportEvent } from '../types';

const SeverityBadge: React.FC<{ severity: ReportEvent['severity'] }> = ({ severity }) => {
    const classes = {
        Low: 'bg-blue-900 text-blue-300',
        Medium: 'bg-yellow-900 text-yellow-300',
        High: 'bg-orange-900 text-orange-300',
        Critical: 'bg-red-900 text-red-300',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${classes[severity]}`}>{severity}</span>;
}


export const EventDetailModal: React.FC<EventDetailModalProps> = ({ isOpen, onClose, event }) => {
    const [videoError, setVideoError] = useState(false);

    useEffect(() => {
        setVideoError(false); // Reset error state when event or its videoUrl changes
    }, [event?.videoUrl, event?.id]);

    if (!isOpen || !event) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-start justify-between">
                         <div>
                            <h2 className="text-2xl font-bold text-white">Event Details</h2>
                            <p className="text-sm text-gray-400 mt-1">{event.id}</p>
                        </div>
                        <button onClick={onClose} className="p-1 text-gray-400 hover:text-white text-3xl">&times;</button>
                    </div>
                </div>

                <div className="p-6 bg-black">
                    {videoError ? (
                        <div className="w-full rounded-md object-cover max-h-[50vh] min-h-[200px] bg-gray-700 flex flex-col justify-center items-center text-gray-400 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Video Not Available
                            <span className="text-xs mt-1">(Check console for errors)</span>
                        </div>
                    ) : (
                        <video 
                            src={event.videoUrl} 
                            className="w-full rounded-md object-cover max-h-[50vh]" 
                            autoPlay 
                            controls 
                            muted
                            key={event.id} // Force re-render if event changes
                            onError={(e) => {
                                setVideoError(true);
                                const error = e.currentTarget.error;
                                console.error(
                                    `Error loading video in EventDetailModal: ${event.id}. ` +
                                    `Code: ${error?.code || 'N/A'}, ` +
                                    `Message: ${error?.message || 'N/A'}. ` +
                                    `URL: ${e.currentTarget.src}` // Use e.currentTarget.src for accuracy
                                );
                            }}
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">Timestamp</h4>
                            <p className="text-white">{new Date(event.timestamp).toLocaleString()}</p>
                        </div>
                         <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">Camera</h4>
                            <p className="text-white">{event.cameraName}</p>
                        </div>
                         <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">Analytic</h4>
                            <p className="text-white">{event.analyticName}</p>
                        </div>
                         <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">Severity</h4>
                            <p className="text-white">
                                <SeverityBadge severity={event.severity} />
                            </p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase">Details</h4>
                        <p className="text-gray-300 mt-2">{event.details}</p>
                    </div>
                </div>
                 <div className="p-6 bg-gray-900 rounded-b-lg text-right">
                    <a 
                        href={event.videoUrl} 
                        download={`event-${event.id}.mp4`}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 mr-4"
                    >
                        Download Clip
                    </a>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
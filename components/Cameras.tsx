import React from 'react';
import type { Camera } from '../types';
import { CameraCard } from './CameraCard';

interface CamerasProps {
    cameras: Camera[];
    onAddCameraClick: () => void;
    onEditCamera: (camera: Camera) => void;
    onDeleteCamera: (camera: Camera) => void;
    onShowPreview: (camera: Camera) => void;
}

export const Cameras: React.FC<CamerasProps> = ({ cameras, onAddCameraClick, onEditCamera, onDeleteCamera, onShowPreview }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-3xl font-bold text-white">Camera Management</h2>
                    <p className="mt-1 text-md text-gray-400">
                        Monitor and manage all connected video streams.
                    </p>
                </div>
                <button 
                    onClick={onAddCameraClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                >
                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Add Camera
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cameras.map(camera => (
                    <CameraCard 
                        key={camera.id} 
                        camera={camera} 
                        onEdit={() => onEditCamera(camera)}
                        onDelete={() => onDeleteCamera(camera)}
                        onShowPreview={() => onShowPreview(camera)}
                    />
                ))}
            </div>
        </div>
    );
};
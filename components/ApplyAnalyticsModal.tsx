
import React, { useState, useEffect } from 'react';
import type { ApplyAnalyticsModalProps } from '../types';

export const ApplyAnalyticsModal: React.FC<ApplyAnalyticsModalProps> = ({ isOpen, onClose, analytic, cameras, onSave }) => {
  const [selectedCameraIds, setSelectedCameraIds] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (analytic && isOpen) {
      const initialSelectedIds = cameras
        .filter(camera => camera.analyticIds.includes(analytic.id))
        .map(camera => camera.id);
      setSelectedCameraIds(new Set(initialSelectedIds));
    }
  }, [isOpen, analytic, cameras]);

  const handleToggleCamera = (cameraId: number) => {
    const newSelection = new Set(selectedCameraIds);
    if (newSelection.has(cameraId)) {
      newSelection.delete(cameraId);
    } else {
      newSelection.add(cameraId);
    }
    setSelectedCameraIds(newSelection);
  };

  const handleSave = async () => {
    if (!analytic) return;
    setIsSaving(true);
    try {
      await onSave(analytic.id, Array.from(selectedCameraIds));
      onClose();
    } catch (error) {
      console.error("Failed to save analytics configuration", error);
      alert("Failed to save configuration. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !analytic) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg transform transition-all">
        <div className="flex items-start justify-between">
            <div>
                 <h2 className="text-2xl font-bold text-white">Configure: {analytic.name}</h2>
                 <p className="text-sm text-gray-400 mt-1">Apply this analytic to one or more cameras.</p>
            </div>
             <button onClick={onClose} className="p-1 text-gray-400 hover:text-white text-3xl">&times;</button>
        </div>
       
        <div className="mt-6 max-h-80 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-3">
                {cameras.map(camera => (
                    <label 
                        key={camera.id}
                        htmlFor={`cam-${camera.id}`}
                        className="flex items-center p-3 bg-gray-700 rounded-md cursor-pointer hover:bg-gray-600 transition-colors"
                    >
                        <input
                            type="checkbox"
                            id={`cam-${camera.id}`}
                            checked={selectedCameraIds.has(camera.id)}
                            onChange={() => handleToggleCamera(camera.id)}
                            className="h-5 w-5 rounded border-gray-500 bg-gray-800 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-4">
                            <span className="font-medium text-white">{camera.name}</span>
                            <span className="text-sm text-gray-400 ml-2">({camera.location})</span>
                        </div>
                    </label>
                ))}
            </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { AddCameraModalProps, Camera } from '../types';

export const AddCameraModal: React.FC<AddCameraModalProps> = ({ isOpen, onClose, onSave, cameraToEdit }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (cameraToEdit) {
      setName(cameraToEdit.name);
      setLocation(cameraToEdit.location);
      setIpAddress(cameraToEdit.ipAddress);
    } else {
      setName('');
      setLocation('');
      setIpAddress('');
    }
  }, [cameraToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Omit fields that are set by the backend (id, status, videoUrl, analyticIds)
    const cameraData: Omit<Camera, 'id' | 'status' | 'videoUrl' | 'analyticIds'> = { name, location, ipAddress };
    
    try {
      if (cameraToEdit) {
        // When editing, we include the existing ID
        await onSave({ ...cameraToEdit, ...cameraData } as Camera);
      } else {
        // When adding, we only pass the data for the new camera
        await onSave(cameraData);
      }
      onClose();
    } catch(error) {
       console.error("Failed to save camera", error);
       alert("Failed to save camera. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md transform transition-all">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{cameraToEdit ? 'Edit Camera' : 'Add New Camera'}</h2>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white text-3xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">Camera Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300">Location</label>
              <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-300">IP Address</label>
              <input type="text" id="ipAddress" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} required pattern="\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}" title="Please enter a valid IP address (e.g., 192.168.1.1)" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? 'Saving...' : 'Save Camera'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

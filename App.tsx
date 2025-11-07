import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Cameras } from './components/Cameras';
import { Analytics } from './components/Analytics';
import { Reports } from './components/Reports';
import { AddCameraModal } from './components/AddCameraModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ApplyAnalyticsModal } from './components/ApplyAnalyticsModal';
import { EventDetailModal } from './components/EventDetailModal';
import { LivePreviewModal } from './components/LivePreviewModal';
import { AnalyzeVideoModal } from './components/AnalyzeVideoModal'; // Import new modal

import type { Page, Camera, ReportEvent, Analytic } from './types';
import * as api from './services/api';

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [cameras, setCameras] = useState<Camera[]>([]);
    const [events, setEvents] = useState<ReportEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [isAddCameraModalOpen, setAddCameraModalOpen] = useState(false);
    const [cameraToEdit, setCameraToEdit] = useState<Camera | null>(null);

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [cameraToDelete, setCameraToDelete] = useState<Camera | null>(null);

    const [isApplyAnalyticsModalOpen, setApplyAnalyticsModalOpen] = useState(false);
    const [analyticToApply, setAnalyticToApply] = useState<Analytic | null>(null);

    const [isEventDetailModalOpen, setEventDetailModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<ReportEvent | null>(null);

    const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
    const [cameraForPreview, setCameraForPreview] = useState<Camera | null>(null);

    const [isAnalyzeVideoModalOpen, setAnalyzeVideoModalOpen] = useState(false); // New state for video analysis modal


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [camerasData, eventsData] = await Promise.all([
                    api.getCameras(),
                    api.getEvents()
                ]);
                setCameras(camerasData);
                setEvents(eventsData);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Start real-time status simulation
    useEffect(() => {
        // Ensure simulation only starts after initial data is loaded
        if (!isLoading) {
            const cleanup = api.startStatusSimulation(setCameras);
            return cleanup;
        }
    }, [isLoading]);

    const refreshCameras = async () => {
        try {
            const camerasData = await api.getCameras();
            setCameras(camerasData);
        } catch (error) {
            console.error("Failed to refresh cameras", error);
        }
    };
    
    // Camera Handlers
    const handleAddCameraClick = () => {
        setCameraToEdit(null);
        setAddCameraModalOpen(true);
    };

    const handleEditCamera = (camera: Camera) => {
        setCameraToEdit(camera);
        setAddCameraModalOpen(true);
    };
    
    const handleSaveCamera = async (cameraData: Omit<Camera, 'id'> | Camera) => {
        await api.saveCamera(cameraData);
        await refreshCameras();
        setAddCameraModalOpen(false);
    };

    const handleDeleteCamera = (camera: Camera) => {
        setCameraToDelete(camera);
        setDeleteModalOpen(true);
    };

    const confirmDeleteCamera = async () => {
        if (cameraToDelete) {
            await api.deleteCamera(cameraToDelete.id);
            await refreshCameras();
            setDeleteModalOpen(false);
            setCameraToDelete(null);
        }
    };

    const handleShowLivePreview = (camera: Camera) => {
        setCameraForPreview(camera);
        setPreviewModalOpen(true);
    };
    
    // Analytics Handlers
    const handleApplyAnalytics = (analytic: Analytic) => {
        setAnalyticToApply(analytic);
        setApplyAnalyticsModalOpen(true);
    };

    const handleSaveAnalytics = async (analyticId: number, cameraIds: number[]) => {
        await api.updateAnalyticsOnCameras(analyticId, cameraIds);
        await refreshCameras();
    };

    // Reports Handlers
    const handleEventClick = (event: ReportEvent) => {
        setSelectedEvent(event);
        setEventDetailModalOpen(true);
    };

    // New: Video Analysis Handler
    const handleAnalyzeVideoClick = () => {
        setAnalyzeVideoModalOpen(true);
    };


    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-full"><p className="text-white text-xl">Loading...</p></div>;
        }
        switch (currentPage) {
            case 'Dashboard':
                return <Dashboard events={events} cameras={cameras} />;
            case 'Cameras':
                return <Cameras cameras={cameras} onAddCameraClick={handleAddCameraClick} onEditCamera={handleEditCamera} onDeleteCamera={handleDeleteCamera} onShowPreview={handleShowLivePreview} />;
            case 'Analytics':
                return <Analytics onApplyAnalytics={handleApplyAnalytics} onAnalyzeVideo={handleAnalyzeVideoClick} />; // Pass new handler
            case 'Reports':
                return <Reports events={events} onEventClick={handleEventClick} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
            <div className="flex flex-col flex-1 w-full overflow-hidden">
                <Header currentPage={currentPage} setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-y-auto bg-gray-900 p-4 sm:p-6 lg:p-8">
                    {renderContent()}
                </main>
            </div>
            
            <AddCameraModal 
                isOpen={isAddCameraModalOpen}
                onClose={() => setAddCameraModalOpen(false)}
                onSave={handleSaveCamera}
                cameraToEdit={cameraToEdit}
            />
            
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeleteCamera}
                title="Delete Camera"
                message={`Are you sure you want to permanently delete "${cameraToDelete?.name}"? This action cannot be undone.`}
            />

            <ApplyAnalyticsModal
                isOpen={isApplyAnalyticsModalOpen}
                onClose={() => setApplyAnalyticsModalOpen(false)}
                analytic={analyticToApply}
                cameras={cameras}
                onSave={handleSaveAnalytics}
            />

            <EventDetailModal
                isOpen={isEventDetailModalOpen}
                onClose={() => setEventDetailModalOpen(false)}
                event={selectedEvent}
            />

            <LivePreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setPreviewModalOpen(false)}
                camera={cameraForPreview}
            />

            <AnalyzeVideoModal // New modal component
                isOpen={isAnalyzeVideoModalOpen}
                onClose={() => setAnalyzeVideoModalOpen(false)}
            />
        </div>
    );
};

export default App;
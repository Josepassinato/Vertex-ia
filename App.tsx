
import React, { useState, useEffect, useCallback, useContext } from 'react';
import type { Page, Camera, Analytic, ReportEvent } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Cameras } from './components/Cameras';
import { Analytics } from './components/Analytics';
import { Reports } from './components/Reports';
import { AddCameraModal } from './components/AddCameraModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ApplyAnalyticsModal } from './components/ApplyAnalyticsModal';
import { EventDetailModal } from './components/EventDetailModal';
import { LivePreviewModal } from './components/LivePreviewModal';
import { AnalyzeVideoModal } from './components/AnalyzeVideoModal';
import { ApiTestModal } from './components/ApiTestModal';
import { LiveAnalyticsModal } from './components/LiveAnalyticsModal';
import { LoginPage } from './components/LoginPage'; // New Login Page
import * as api from './services/api';
import { FirebaseContext } from './index'; // Import Firebase context
import { User, onAuthStateChanged, signOut } from 'firebase/auth';


const App: React.FC = () => {
  const { auth, db } = useContext(FirebaseContext); // Get auth and db from context

  const [currentUser, setCurrentUser] = useState<User | null>(null); // Firebase User
  const [authLoading, setAuthLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data states
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [analytics, setAnalytics] = useState<Analytic[]>([]);
  const [events, setEvents] = useState<ReportEvent[]>([]);

  // Modals visibility and data
  const [isAddCameraModalOpen, setIsAddCameraModalOpen] = useState(false);
  const [cameraToEdit, setCameraToEdit] = useState<Camera | null>(null);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState<Camera | null>(null);

  const [isApplyAnalyticsModalOpen, setIsApplyAnalyticsModalOpen] = useState(false);
  const [analyticToConfigure, setAnalyticToConfigure] = useState<Analytic | null>(null);

  const [isEventDetailModalOpen, setIsEventDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ReportEvent | null>(null);

  const [isLivePreviewModalOpen, setIsLivePreviewModalOpen] = useState(false);
  const [cameraForPreview, setCameraForPreview] = useState<Camera | null>(null);

  const [isAnalyzeVideoModalOpen, setIsAnalyzeVideoModalOpen] = useState(false);
  const [isApiTestModalOpen, setIsApiTestModalOpen] = useState(false);

  const [isLiveAnalyticsModalOpen, setIsLiveAnalyticsModalOpen] = useState(false);
  const [cameraForLiveAnalytics, setCameraForLiveAnalytics] = useState<Camera | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);


  // Fetch initial data using Firebase real-time listeners
  const setupFirestoreListeners = useCallback(() => {
    if (!currentUser) {
      // Don't set up listeners if not authenticated
      setIsLoading(false);
      return () => {}; // Return empty cleanup function
    }

    setIsLoading(true);
    setError(null);

    const unsubCameras = api.onCamerasSnapshot(
      db, // Pass db here
      (newCameras) => { setCameras(newCameras); setIsLoading(false); },
      (err) => { console.error("Error fetching cameras:", err); setError("Failed to load cameras."); setIsLoading(false); }
    );
    const unsubAnalytics = api.onAnalyticsSnapshot(
      db, // Pass db here
      (newAnalytics) => { setAnalytics(newAnalytics); setIsLoading(false); },
      (err) => { console.error("Error fetching analytics:", err); setError("Failed to load analytics."); setIsLoading(false); }
    );
    const unsubEvents = api.onEventsSnapshot(
      db, // Pass db here
      (newEvents) => { setEvents(newEvents); setIsLoading(false); },
      (err) => { console.error("Error fetching events:", err); setError("Failed to load events."); setIsLoading(false); }
    );
    
    // Cleanup listeners on component unmount or user logout
    return () => {
      unsubCameras();
      unsubAnalytics();
      unsubEvents();
    };
  }, [currentUser, db]); // Add db to dependencies

  useEffect(() => {
    // Only set up listeners once auth state is determined
    if (!authLoading) {
      return setupFirestoreListeners();
    }
  }, [authLoading, setupFirestoreListeners]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear all state after logout
      setCameras([]);
      setAnalytics([]);
      setEvents([]);
      setCurrentPage('Dashboard');
    } catch (err) {
      console.error("Failed to log out:", err);
      alert("Error logging out. Please try again.");
    }
  };

  // Camera Actions
  const handleAddCameraClick = () => {
    setCameraToEdit(null);
    setIsAddCameraModalOpen(true);
  };

  const handleSaveCamera = async (camera: Omit<Camera, 'id'> | Camera) => {
    try {
      if ('id' in camera) {
        // Editing existing camera
        await api.updateCamera(db, camera as Camera); // Pass db
        // setCameras will be updated by Firestore listener
      } else {
        // Adding new camera
        await api.addCamera(db, camera); // Pass db
        // setCameras will be updated by Firestore listener
      }
      setIsAddCameraModalOpen(false);
      setCameraToEdit(null);
    } catch (err: any) {
      console.error("Failed to save camera:", err);
      alert(`Error saving camera: ${err.message || 'See console for details.'}`);
    }
  };

  const handleEditCamera = (camera: Camera) => {
    setCameraToEdit(camera);
    setIsAddCameraModalOpen(true);
  };

  const handleDeleteCameraClick = (camera: Camera) => {
    setCameraToDelete(camera);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleConfirmDeleteCamera = async () => {
    if (cameraToDelete) {
      try {
        await api.deleteCamera(db, cameraToDelete.id); // Pass db
        // setCameras will be updated by Firestore listener
        setIsConfirmDeleteModalOpen(false);
        setCameraToDelete(null);
      } catch (err: any) {
        console.error("Failed to delete camera:", err);
        alert(`Error deleting camera: ${err.message || 'See console for details.'}`);
      }
    }
  };

  // Analytics Actions
  const handleApplyAnalytics = (analytic: Analytic) => {
    setAnalyticToConfigure(analytic);
    setIsApplyAnalyticsModalOpen(true);
  };

  // Fix: Changed parameter types for analyticId and cameraIds to string and string[]
  const handleSaveAnalyticsConfiguration = async (analyticId: string, cameraIds: string[]) => {
    try {
      await api.applyAnalyticsToCamera(db, analyticId, cameraIds); // Pass db
      // cameras will be updated by Firestore listener
      setIsApplyAnalyticsModalOpen(false);
      setAnalyticToConfigure(null);
    } catch (err: any) {
      console.error("Failed to save analytics configuration:", err);
      alert(`Error saving analytics configuration: ${err.message || 'See console for details.'}`);
    }
  };

  const handleEventClick = (event: ReportEvent) => {
    setSelectedEvent(event);
    setIsEventDetailModalOpen(true);
  };

  const handleShowPreview = (camera: Camera) => {
    setCameraForPreview(camera);
    setIsLivePreviewModalOpen(true);
  };

  const handleOpenAnalyzeVideoModal = () => {
    setIsAnalyzeVideoModalOpen(true);
  };

  const handleOpenApiTestModal = () => {
    setIsApiTestModalOpen(true);
  };

  const handleStartLiveAnalysis = (camera: Camera) => {
    setCameraForLiveAnalytics(camera);
    setIsLiveAnalyticsModalOpen(true);
  };

  const handleAddNewReportEvent = async (event: Omit<ReportEvent, 'id'>) => {
    try {
      await api.addEvent(db, event); // Pass db
      // events will be updated by Firestore listener
    } catch (err: any) {
      console.error("Failed to add new report event:", err);
      alert(`Error adding event: ${err.message || 'See console for details.'}`);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg">Loading application data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center p-8 bg-red-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="mb-6">{error}</p>
          <button
            onClick={setupFirestoreListeners} // Retry loading data
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentPage={currentPage} setSidebarOpen={setIsSidebarOpen} onLogout={handleLogout} currentUser={currentUser} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-6">
          {currentPage === 'Dashboard' && <Dashboard events={events} cameras={cameras} />}
          {currentPage === 'Cameras' && (
            <Cameras
              cameras={cameras}
              onAddCameraClick={handleAddCameraClick}
              onEditCamera={handleEditCamera}
              onDeleteCamera={handleDeleteCameraClick}
              onShowPreview={handleShowPreview}
              onStartLiveAnalysis={handleStartLiveAnalysis}
              analytics={analytics}
            />
          )}
          {currentPage === 'Analytics' && (
            <Analytics
              onApplyAnalytics={handleApplyAnalytics}
              onAnalyzeVideo={handleOpenAnalyzeVideoModal}
              onOpenApiTestModal={handleOpenApiTestModal}
              analytics={analytics}
            />
          )}
          {currentPage === 'Reports' && <Reports events={events} onEventClick={handleEventClick} />}
        </main>
      </div>

      {/* Modals */}
      <AddCameraModal
        isOpen={isAddCameraModalOpen}
        onClose={() => setIsAddCameraModalOpen(false)}
        onSave={handleSaveCamera}
        cameraToEdit={cameraToEdit}
      />
      <ConfirmationModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => setIsConfirmDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteCamera}
        title="Delete Camera"
        message={`Are you sure you want to delete camera "${cameraToDelete?.name}"? This action cannot be undone.`}
      />
      <ApplyAnalyticsModal
        isOpen={isApplyAnalyticsModalOpen}
        onClose={() => setIsApplyAnalyticsModalOpen(false)}
        analytic={analyticToConfigure}
        cameras={cameras}
        onSave={handleSaveAnalyticsConfiguration}
      />
      <EventDetailModal
        isOpen={isEventDetailModalOpen}
        onClose={() => setIsEventDetailModalOpen(false)}
        event={selectedEvent}
      />
      <LivePreviewModal
        isOpen={isLivePreviewModalOpen}
        onClose={() => setIsLivePreviewModalOpen(false)}
        camera={cameraForPreview}
      />
      <AnalyzeVideoModal
        isOpen={isAnalyzeVideoModalOpen}
        onClose={() => setIsAnalyzeVideoModalOpen(false)}
      />
      <ApiTestModal
        isOpen={isApiTestModalOpen}
        onClose={() => setIsApiTestModalOpen(false)}
      />
       <LiveAnalyticsModal
        isOpen={isLiveAnalyticsModalOpen}
        onClose={() => setIsLiveAnalyticsModalOpen(false)}
        camera={cameraForLiveAnalytics}
        onAddEvent={handleAddNewReportEvent}
        analytics={analytics}
      />
    </div>
  );
};

export default App;
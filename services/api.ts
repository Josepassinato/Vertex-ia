
import type { Camera, Analytic, ReportEvent, CameraStatus, EventSeverity, VideoAnalysisResult } from '../types';
// import { FirebaseContext } from '../index'; // Removed useContext and FirebaseContext import
// import { useContext } from 'react'; // Removed useContext and FirebaseContext import
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  getDocs,
  where,
  type Firestore // Added Firestore type import
} from 'firebase/firestore';
import { iconMap } from '../constants'; // Import the iconMap

// Placeholder for Cloud Functions base URL
// IMPORTANT: Replace with your actual Firebase Cloud Functions HTTP endpoint URL
const CLOUD_FUNCTION_BASE_URL = "https://us-central1-gen-lang-client-0912581918.cloudfunctions.net"; 
// Example: https://us-central1-my-cool-project-12345.cloudfunctions.net

if (CLOUD_FUNCTION_BASE_URL.includes("YOUR_PROJECT_ID")) {
  console.warn(
    "ATENÇÃO: 'CLOUD_FUNCTION_BASE_URL' em services/api.ts ainda é um valor de placeholder. " +
      "Por favor, atualize-o com a URL base real de suas Firebase Cloud Functions para que as funcionalidades de IA funcionem."
  );
}

interface FirestoreCamera extends Omit<Camera, 'analyticIds'> {
  analyticIds: string[]; // Ensure this matches Firestore's representation
}

// Helper to map Firestore data to frontend types
const mapDocToCamera = (doc: any): Camera => ({
  id: doc.id,
  name: doc.data().name,
  location: doc.data().location,
  ipAddress: doc.data().ipAddress,
  status: doc.data().status || 'Offline', // Default status if not set
  videoUrl: doc.data().videoUrl || '/videos/default.mp4', // Default video URL
  analyticIds: doc.data().analyticIds || [],
});

const mapDocToAnalytic = (doc: any): Analytic => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    version: data.version,
    iconName: data.iconName,
    icon: iconMap[data.iconName] || iconMap.DefaultAnalyticIcon, // Map string name to React component
    tags: data.tags || [],
  };
};

const mapDocToEvent = (doc: any): ReportEvent => ({
  id: doc.id,
  timestamp: doc.data().timestamp,
  cameraName: doc.data().cameraName,
  analyticName: doc.data().analyticName,
  severity: doc.data().severity,
  videoUrl: doc.data().videoUrl,
  details: doc.data().details,
});

// --- Firestore Data Listeners (Real-time) ---

export const onCamerasSnapshot = (
  db: Firestore, // Accept db as argument
  onData: (cameras: Camera[]) => void, 
  onError: (error: Error) => void
) => {
  const q = query(collection(db, "cameras"), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const cameras = snapshot.docs.map(mapDocToCamera);
    onData(cameras);
  }, onError);
};

export const onAnalyticsSnapshot = (
  db: Firestore, // Accept db as argument
  onData: (analytics: Analytic[]) => void, 
  onError: (error: Error) => void
) => {
  const q = query(collection(db, "analytics"), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const analytics = snapshot.docs.map(mapDocToAnalytic);
    onData(analytics);
  }, onError);
};

export const onEventsSnapshot = (
  db: Firestore, // Accept db as argument
  onData: (events: ReportEvent[]) => void, 
  onError: (error: Error) => void
) => {
  const q = query(collection(db, "events"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(mapDocToEvent);
    onData(events);
  }, onError);
};


// --- CRUD Operations ---

export const fetchCameras = async (db: Firestore): Promise<Camera[]> => { // Accept db as argument
  const querySnapshot = await getDocs(collection(db, "cameras"));
  return querySnapshot.docs.map(mapDocToCamera);
};

export const addCamera = async (
  db: Firestore, // Accept db as argument
  camera: Omit<Camera, 'id' | 'status' | 'videoUrl' | 'analyticIds'>
): Promise<Camera> => {
  const newCameraData = {
    ...camera,
    status: 'Offline', // Default status for new camera
    videoUrl: '/videos/default.mp4', // Default video for new camera
    analyticIds: [], // No analytics applied by default
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, "cameras"), newCameraData);
  return { id: docRef.id, ...newCameraData } as Camera;
};

export const updateCamera = async (
  db: Firestore, // Accept db as argument
  updatedCamera: Camera
): Promise<Camera> => {
  const cameraRef = doc(db, "cameras", updatedCamera.id);
  const dataToUpdate = {
    name: updatedCamera.name,
    location: updatedCamera.location,
    ipAddress: updatedCamera.ipAddress,
    status: updatedCamera.status,
    videoUrl: updatedCamera.videoUrl,
    analyticIds: updatedCamera.analyticIds,
    updatedAt: new Date().toISOString(),
  };
  await updateDoc(cameraRef, dataToUpdate);
  return updatedCamera;
};

export const deleteCamera = async (
  db: Firestore, // Accept db as argument
  id: string
): Promise<void> => {
  await deleteDoc(doc(db, "cameras", id));
};

export const fetchAnalytics = async (db: Firestore): Promise<Analytic[]> => { // Accept db as argument
  const querySnapshot = await getDocs(collection(db, "analytics"));
  return querySnapshot.docs.map(mapDocToAnalytic);
};

export const applyAnalyticsToCamera = async (
  db: Firestore, // Accept db as argument
  analyticId: string, 
  cameraIds: string[]
): Promise<void> => {
  // First, get all cameras that currently have this analytic
  const currentCamerasWithAnalyticQuery = query(collection(db, "cameras"), where("analyticIds", "array-contains", analyticId));
  const currentCamerasSnapshot = await getDocs(currentCamerasWithAnalyticQuery);
  const currentCamerasWithAnalytic = currentCamerasSnapshot.docs.map(doc => doc.id);

  // Determine cameras to add the analytic to
  const camerasToAddAnalytic = cameraIds.filter(id => !currentCamerasWithAnalytic.includes(id));
  // Determine cameras to remove the analytic from
  const camerasToRemoveAnalytic = currentCamerasWithAnalytic.filter(id => !cameraIds.includes(id));

  // Update cameras to add the analytic
  for (const cameraId of camerasToAddAnalytic) {
    const cameraRef = doc(db, "cameras", cameraId);
    const cameraDoc = await getDocs(query(collection(db, "cameras"), where("id", "==", cameraId)));
    if (!cameraDoc.empty) {
        const currentAnalyticIds = cameraDoc.docs[0].data().analyticIds || [];
        if (!currentAnalyticIds.includes(analyticId)) {
            await updateDoc(cameraRef, { 
                analyticIds: [...currentAnalyticIds, analyticId],
                updatedAt: new Date().toISOString(),
            });
        }
    }
  }

  // Update cameras to remove the analytic
  for (const cameraId of camerasToRemoveAnalytic) {
    const cameraRef = doc(db, "cameras", cameraId);
    const cameraDoc = await getDocs(query(collection(db, "cameras"), where("id", "==", cameraId)));
    if (!cameraDoc.empty) {
        const currentAnalyticIds = cameraDoc.docs[0].data().analyticIds || [];
        await updateDoc(cameraRef, { 
            analyticIds: currentAnalyticIds.filter((id: string) => id !== analyticId),
            updatedAt: new Date().toISOString(),
        });
    }
  }
};


export const fetchEvents = async (db: Firestore): Promise<ReportEvent[]> => { // Accept db as argument
  const querySnapshot = await getDocs(query(collection(db, "events"), orderBy("timestamp", "desc")));
  return querySnapshot.docs.map(mapDocToEvent);
};

export const addEvent = async (
  db: Firestore, // Accept db as argument
  event: Omit<ReportEvent, 'id'>
): Promise<ReportEvent> => {
  const newEventData = {
    ...event,
    timestamp: new Date().toISOString(), // Ensure timestamp is set on creation
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, "events"), newEventData);
  return { id: docRef.id, ...newEventData } as ReportEvent;
};

// --- Cloud Functions for AI/External API Interactions ---
// These functions will call your Firebase Cloud Functions HTTP endpoints.
// You MUST implement these Cloud Functions on your Firebase project.

const handleCloudFunctionError = (err: any, functionName: string): Error => {
  console.error(`Cloud Function ${functionName} error:`, err);
  if (err.response && err.response.data && err.response.data.error) {
    return new Error(`Cloud Function ${functionName} failed: ${err.response.data.error.message}`);
  }
  return new Error(`Failed to call Cloud Function ${functionName}: ${err.message || 'Unknown error'}`);
};

export const testGeminiConnectivity = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(`${CLOUD_FUNCTION_BASE_URL}/testGeminiConnectivity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`, // Example for authenticated calls
      },
      body: JSON.stringify({ prompt }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Cloud Function error');
    }
    return data.response;
  } catch (err: any) {
    throw handleCloudFunctionError(err, 'testGeminiConnectivity');
  }
};

// Fix: Changed return type from Analytic[] to VideoAnalysisResult[]
export const analyzeVideoFile = async (file: File): Promise<VideoAnalysisResult[]> => {
  try {
    const formData = new FormData();
    formData.append('video', file);

    const response = await fetch(`${CLOUD_FUNCTION_BASE_URL}/analyzeVideoFile`, {
      method: 'POST',
      // 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`, // Example for authenticated calls
      body: formData, // Content-Type will be handled by browser for FormData
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Cloud Function error');
    }
    return data.results; // Expecting an array of VideoAnalysisResult from your CF
  } catch (err: any) {
    throw handleCloudFunctionError(err, 'analyzeVideoFile');
  }
};

export const analyzeLiveFrame = async (cameraId: string, base64Image: string, analyticsToApply: string[]): Promise<string> => {
  try {
    const response = await fetch(`${CLOUD_FUNCTION_BASE_URL}/analyzeLiveFrame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`, // Example for authenticated calls
      },
      body: JSON.stringify({ cameraId, base64Image, analyticsToApply }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Cloud Function error');
    }
    return data.description;
  } catch (err: any) {
    throw handleCloudFunctionError(err, 'analyzeLiveFrame');
  }
};


// --- Initial Data Population (Run ONLY ONCE for a new Firebase project) ---
// You would remove this in a production app after initial setup.
export const populateInitialData = async (db: Firestore) => { // Accept db as argument
  // Check if collections are empty before populating
  const camerasCollection = await getDocs(collection(db, "cameras"));
  const analyticsCollection = await getDocs(collection(db, "analytics"));
  const eventsCollection = await getDocs(collection(db, "events"));

  if (camerasCollection.empty) {
    console.log("Populating initial cameras...");
    await Promise.all([
      addDoc(collection(db, "cameras"), { name: 'Main Entrance', location: 'Lobby', ipAddress: '192.168.1.101', status: 'Online', videoUrl: '/videos/cam1.mp4', analyticIds: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
      addDoc(collection(db, "cameras"), { name: 'Warehouse Aisle 3', location: 'Warehouse', ipAddress: '192.168.1.102', status: 'Recording', videoUrl: '/videos/cam2.mp4', analyticIds: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
      addDoc(collection(db, "cameras"), { name: 'Loading Dock', location: 'Exterior', ipAddress: '192.168.1.103', status: 'Offline', videoUrl: '/videos/cam3.mp4', analyticIds: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
      addDoc(collection(db, "cameras"), { name: 'Server Room', location: 'Data Center', ipAddress: '192.168.1.104', status: 'Online', videoUrl: '/videos/cam4.mp4', analyticIds: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
    ]);
  }

  if (analyticsCollection.empty) {
    console.log("Populating initial analytics...");
    await Promise.all([
      addDoc(collection(db, "analytics"), { name: 'Facial Recognition', description: 'Identifies known individuals and detects unknown faces.', version: '1.2.0', iconName: 'FaceRecognitionIcon', tags: ['Security', 'Access Control'] }),
      addDoc(collection(db, "analytics"), { name: 'License Plate Recognition (LPR)', description: 'Reads and logs vehicle license plates for vehicle tracking.', version: '2.0.1', iconName: 'LPROIcon', tags: ['Traffic', 'Parking'] }),
      addDoc(collection(db, "analytics"), { name: 'Object Detection & Tracking', description: 'Detects and tracks specific objects within the video feed.', version: '1.5.3', iconName: 'ObjectDetectionIcon', tags: ['Inventory', 'Safety'] }),
      addDoc(collection(db, "analytics"), { name: 'Behavioral Anomaly Detection', description: 'Flags unusual activities or deviations from normal patterns.', version: '1.0.0', iconName: 'AnomalyDetectionIcon', tags: ['Security', 'Compliance'] }),
      addDoc(collection(db, "analytics"), { name: 'Fire & Smoke Detection', description: 'Detects presence of fire or smoke for early warning.', version: '1.1.0', iconName: 'DefaultAnalyticIcon', tags: ['Safety', 'Emergency'] }),
      addDoc(collection(db, "analytics"), { name: 'Intrusion Detection', description: 'Alerts on unauthorized entry into defined zones.', version: '1.0.5', iconName: 'DefaultAnalyticIcon', tags: ['Security', 'Perimeter'] }),
    ]);
  }

  if (eventsCollection.empty) {
    console.log("Populating initial events...");
    await Promise.all([
      addDoc(collection(db, "events"), { timestamp: new Date(Date.now() - 3600000).toISOString(), cameraName: 'Main Entrance', analyticName: 'Facial Recognition', severity: 'High', videoUrl: '/videos/event1.mp4', details: 'Unknown person detected entering restricted area.' }),
      addDoc(collection(db, "events"), { timestamp: new Date(Date.now() - 7200000).toISOString(), cameraName: 'Warehouse Aisle 3', analyticName: 'Object Detection & Tracking', severity: 'Low', videoUrl: '/videos/event2.mp4', details: 'Pallet moved to incorrect location.' }),
      addDoc(collection(db, "events"), { timestamp: new Date(Date.now() - 10800000).toISOString(), cameraName: 'Loading Dock', analyticName: 'License Plate Recognition (LPR)', severity: 'Medium', videoUrl: '/videos/event3.mp4', details: 'Vehicle without registered plate detected.' }),
      addDoc(collection(db, "events"), { timestamp: new Date(Date.now() - 14400000).toISOString(), cameraName: 'Server Room', analyticName: 'Behavioral Anomaly Detection', severity: 'Critical', videoUrl: '/videos/event4.mp4', details: 'Unusual activity detected after hours.' }),
    ]);
  }
};
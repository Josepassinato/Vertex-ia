import { Camera, ReportEvent, CameraStatus } from '../types';
import { GoogleGenAI } from "@google/genai"; // Import GoogleGenAI

// Royalty-free videos for simulation - New selection focused on "analytics test videos" and SD resolution for compatibility
const VIDEO_FEEDS = [
    // Cenários de Escritório/Pessoas (mais claros para reconhecimento/detecção)
    'https://videos.pexels.com/video-files/3861849/3861849-sd_640_360_25fps.mp4', // 0: Lobby Entrance - Pessoas caminhando em corredor de escritório
    'https://videos.pexels.com/video-files/2493540/2493540-sd_640_360_25fps.mp4', // 1: Server Room / Office - Pessoas trabalhando em computadores, movimentação sutil
    'https://videos.pexels.com/video-files/6697479/6697479-sd_640_360_25fps.mp4', // 2: Cafeteria - Vista de cafeteria com pessoas sentadas e andando
    
    // Cenários de Estacionamento/Automóveis (mais claros para LPR/detecção de objetos)
    'https://videos.pexels.com/video-files/4034293/4034293-sd_640_360_30fps.mp4', // 3: Parking Lot - Carros entrando e saindo de estacionamento
    'https://videos.pexels.com/video-files/3860007/3860007-sd_640_360_25fps.mp4', // 4: Warehouse Dock / Street - Vista de rua com pessoas e veículos
    
    // Cenários Gerais de Segurança/Observação (SD para compatibilidade)
    'https://videos.pexels.com/video-files/10255878/10255878-sd_640_360_25fps.mp4', // 5: Rooftop / City - Vista aérea de cidade com tráfego e pedestres
    'https://videos.pexels.com/video-files/5837941/5837941-sd_640_360_24fps.mp4', // 6: General Office - Ambiente de escritório com pessoas caminhando
    'https://videos.pexels.com/video-files/4207914/4207914-sd_640_360_30fps.mp4', // 7: Another parking/road scene - Mais carros em movimento
];

let MOCK_CAMERAS: Camera[] = [
    { id: 1, name: 'Lobby Entrance', location: 'Main Building, 1st Floor', ipAddress: '192.168.1.101', status: 'Recording', videoUrl: VIDEO_FEEDS[0], analyticIds: [1, 4] },
    { id: 2, name: 'Parking Lot P2', location: 'West Garage', ipAddress: '192.168.1.102', status: 'Online', videoUrl: VIDEO_FEEDS[3], analyticIds: [2] },
    { id: 3, name: 'Warehouse Dock A', location: 'Logistics Center', ipAddress: '192.168.1.103', status: 'Offline', videoUrl: VIDEO_FEEDS[4], analyticIds: [] },
    { id: 4, name: 'Server Room', location: 'Data Center, B-Wing', ipAddress: '192.168.1.104', status: 'Online', videoUrl: VIDEO_FEEDS[1], analyticIds: [1, 3, 4] },
    { id: 5, name: 'Rooftop East', location: 'Main Building, Roof', ipAddress: '192.168.1.105', status: 'Online', videoUrl: VIDEO_FEEDS[5], analyticIds: [3] },
    { id: 6, name: 'Cafeteria', location: 'Campus Center', ipAddress: '192.168.1.106', status: 'Offline', videoUrl: VIDEO_FEEDS[2], analyticIds: [4] },
];

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
const ANALYTICS = ['Facial Recognition', 'LPR', 'Object Detection', 'Anomaly Detection'];

let MOCK_EVENTS: ReportEvent[] = Array.from({ length: 50 }, (_, i) => {
    const camera = MOCK_CAMERAS[i % MOCK_CAMERAS.length];
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(i / 2));
    date.setMinutes(Math.floor(Math.random() * 60));

    return {
        id: `evt-${i}`,
        timestamp: date.toISOString(),
        cameraName: camera.name,
        analyticName: ANALYTICS[i % ANALYTICS.length],
        severity: SEVERITIES[i % SEVERITIES.length],
        videoUrl: VIDEO_FEEDS[i % VIDEO_FEEDS.length], // Use a video for the event clip
        details: 'A brief, auto-generated summary of the event would appear here, detailing what was detected.'
    };
}).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());


// Simulate API latency
const apiDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getCameras = async (): Promise<Camera[]> => {
    await apiDelay(500);
    return [...MOCK_CAMERAS];
};

export const getEvents = async (): Promise<ReportEvent[]> => {
    await apiDelay(700);
    return [...MOCK_EVENTS];
};

export const saveCamera = async (cameraData: Omit<Camera, 'id'> | Camera): Promise<Camera> => {
    await apiDelay(1000);
    if ('id' in cameraData) {
        // Update existing camera
        const index = MOCK_CAMERAS.findIndex(c => c.id === cameraData.id);
        if (index > -1) {
            MOCK_CAMERAS[index] = { ...MOCK_CAMERAS[index], ...cameraData };
            return MOCK_CAMERAS[index];
        } else {
            throw new Error("Camera not found");
        }
    } else {
        // Add new camera
        const newCamera: Camera = {
            id: Math.max(...MOCK_CAMERAS.map(c => c.id), 0) + 1,
            status: 'Online' as CameraStatus, // Default status
            videoUrl: VIDEO_FEEDS[Math.floor(Math.random() * VIDEO_FEEDS.length)], // Assign a default video
            analyticIds: [],
            ...cameraData
        };
        MOCK_CAMERAS.push(newCamera);
        return newCamera;
    }
};

export const deleteCamera = async (cameraId: number): Promise<void> => {
    await apiDelay(800);
    const index = MOCK_CAMERAS.findIndex(c => c.id === cameraId);
    if (index > -1) {
        MOCK_CAMERAS.splice(index, 1);
    } else {
        throw new Error("Camera not found");
    }
};

export const updateAnalyticsOnCameras = async (analyticId: number, cameraIds: number[]): Promise<void> => {
    await apiDelay(1200);
    MOCK_CAMERAS.forEach(camera => {
        const hasAnalytic = camera.analyticIds.includes(analyticId);
        const shouldHaveAnalytic = cameraIds.includes(camera.id);

        if (hasAnalytic && !shouldHaveAnalytic) {
            // Remove it
            camera.analyticIds = camera.analyticIds.filter(id => id !== analyticId);
        } else if (!hasAnalytic && shouldHaveAnalytic) {
            // Add it
            camera.analyticIds.push(analyticId);
        }
    });
};

export const startStatusSimulation = (updateCallback: (cameras: Camera[]) => void): (() => void) => {
    const intervalId = setInterval(() => {
        if (MOCK_CAMERAS.length === 0) return;

        const cameraIndex = Math.floor(Math.random() * MOCK_CAMERAS.length);
        const cameraToUpdate = MOCK_CAMERAS[cameraIndex];

        const statuses: CameraStatus[] = ['Online', 'Offline', 'Recording'];
        const possibleNewStatuses = statuses.filter(s => s !== cameraToUpdate.status);
        const newStatus = possibleNewStatuses[Math.floor(Math.random() * possibleNewStatuses.length)];
        
        cameraToUpdate.status = newStatus;
        
        // Notify the frontend of the change
        updateCallback([...MOCK_CAMERAS]);

    }, 4000); // Update every 4 seconds

    return () => clearInterval(intervalId);
};

// New function for video frame analysis using GoogleGenAI
export const analyzeVideoFrame = async (base64ImageData: string, framePrompt: string = 'Describe the objects and activities in this image.'): Promise<string> => {
    // IMPORTANT: Create a new GoogleGenAI instance right before making an API call
    // to ensure it always uses the most up-to-date API key from the dialog.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', // Model for image analysis
            contents: {
                parts: [
                    { text: framePrompt },
                    {
                        inlineData: {
                            mimeType: 'image/jpeg', // Assuming JPEG frames
                            data: base64ImageData,
                        },
                    },
                ],
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for video frame analysis:", error);
        throw new Error("Failed to analyze video frame with Gemini API. Check console for details.");
    }
};
import React from 'react';

export type Page = 'Dashboard' | 'Cameras' | 'Analytics' | 'Reports';

export type CameraStatus = 'Online' | 'Offline' | 'Recording';

export interface Camera {
  id: number;
  name: string;
  location: string;
  ipAddress: string;
  status: CameraStatus;
  videoUrl: string; // Changed from imageUrl
  analyticIds: number[];
}

export interface Analytic {
  id: number;
  name: string;
  description: string;
  version: string;
  icon: React.FC<{className?: string}>;
  tags: string[];
}

export type EventSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ReportEvent {
  id: string;
  timestamp: string;
  cameraName: string;
  analyticName: string;
  severity: EventSeverity;
  videoUrl: string; // Changed from imageUrl
  details: string;
}

export interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (camera: Omit<Camera, 'id'> | Camera) => void;
  cameraToEdit: Camera | null;
}

export interface ApplyAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    analytic: Analytic | null;
    cameras: Camera[];
    onSave: (analyticId: number, cameraIds: number[]) => Promise<void>;
}

export interface EventDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: ReportEvent | null;
}

export interface LivePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    camera: Camera | null;
}

// New types for video analysis
export interface VideoAnalysisResult {
    frameNumber: number;
    timestamp: number; // in seconds
    imageUrl: string; // Base64 image data for the frame
    description: string; // Text description from Gemini
}

export interface AnalyzeVideoModalProps {
    isOpen: boolean;
    onClose: () => void;
}
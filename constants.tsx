
import React from 'react';
// No longer importing Analytic type here to avoid circular dependency
// with types.ts which will now have iconName string.

// Icons
export const DashboardIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);
export const CameraIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55a2 2 0 01.45 2.12l-2.4 7A2 2 0 0115.5 21H8.5a2 2 0 01-2-2.12l2.4-7A2 2 0 0110.45 10H15z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10V7a3 3 0 00-3-3H9a3 3 0 00-3 3v3m5 0h2m-5 4h5m2 0h.01" />
    </svg>
);
export const AnalyticsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);
export const ReportsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
export const FaceRecognitionIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l-5.5-5.5a2 2 0 112.828-2.828L10 14.172l4.672-4.672a2 2 0 112.828 2.828L12 20h-2zM4 10V7a2 2 0 012-2h12a2 2 0 012 2v3m-4-3v.01" />
    </svg>
);
export const LPROIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.472 4.416m-3.14.002l-1.472-4.416a1 1 0 01.948-.684H18a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm3 0v10m0-10L9 2m-3 3h3m12 0h-3m-1 10V5m1 10l3 3m-4-3v3" />
    </svg>
);
export const ObjectDetectionIcon: React.FC<{className?: string}> = ({ className }) => (
     <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m3-3v6" />
    </svg>
);
export const AnomalyDetectionIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const DefaultAnalyticIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10m-4 0h16.707a1 1 0 00.707-.293l3.293-3.293c.39-.39.39-1.023 0-1.414l-3.293-3.293a1 1 0 00-.707-.293H4z" /></svg>
);

// Map of icon names to actual React components
export const iconMap: { [key: string]: React.FC<{className?: string}> } = {
  FaceRecognitionIcon: FaceRecognitionIcon,
  LPROIcon: LPROIcon,
  ObjectDetectionIcon: ObjectDetectionIcon,
  AnomalyDetectionIcon: AnomalyDetectionIcon,
  DefaultAnalyticIcon: DefaultAnalyticIcon,
  // Add other icons here as needed
};

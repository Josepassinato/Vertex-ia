import React from 'react';
import { MOCK_ANALYTICS } from '../constants';
import type { Analytic } from '../types';

interface AnalyticCardProps {
    analytic: Analytic;
    onApply: (analytic: Analytic) => void;
}

const AnalyticCard: React.FC<AnalyticCardProps> = ({ analytic, onApply }) => {
    const { name, description, version, icon: Icon, tags } = analytic;

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-start h-full transform hover:-translate-y-2 transition-transform duration-300">
            <div className="flex items-center mb-4">
                <div className="bg-gray-700 p-3 rounded-full mr-4">
                    <Icon className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{name}</h3>
                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">v{version}</span>
                </div>
            </div>
            <p className="text-gray-300 text-sm mb-4 flex-grow">{description}</p>
            <div className="flex flex-wrap gap-2 mb-6">
                {tags.map(tag => (
                    <span key={tag} className="text-xs font-semibold bg-blue-900 text-blue-300 px-2 py-1 rounded-full">{tag}</span>
                ))}
            </div>
            <button 
                onClick={() => onApply(analytic)}
                className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
                Configure & Apply
            </button>
        </div>
    );
};

interface AnalyticsProps {
    onApplyAnalytics: (analytic: Analytic) => void;
    onAnalyzeVideo: () => void; // New prop
}

export const Analytics: React.FC<AnalyticsProps> = ({ onApplyAnalytics, onAnalyzeVideo }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">Vertex AI Vision Analytics</h2>
                    <p className="mt-2 text-md text-gray-400">
                        Deploy powerful, pre-built AI models to your camera streams with a single click.
                    </p>
                </div>
                <button 
                    onClick={onAnalyzeVideo}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                >
                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Analyze Video File
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
                {MOCK_ANALYTICS.map(analytic => (
                    <AnalyticCard key={analytic.id} analytic={analytic} onApply={onApplyAnalytics} />
                ))}
            </div>
        </div>
    );
};
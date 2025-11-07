
import React, { useState, useEffect } from 'react';
import type { ApiTestModalProps } from '../types';
import * as api from '../services/api'; // Import the new API service

export const ApiTestModal: React.FC<ApiTestModalProps> = ({ isOpen, onClose }) => {
    const [prompt, setPrompt] = useState('Tell me a short, interesting fact about AI.');
    const [response, setResponse] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // hasApiKey state is no longer managed by frontend via window.aistudio
    // It is assumed to be handled securely by the backend (Cloud Function).

    useEffect(() => {
        if (!isOpen) {
            setResponse(null);
            setError(null);
            setIsLoading(false);
            setPrompt('Tell me a short, interesting fact about AI.');
        }
    }, [isOpen]);

    const handleTestApi = async () => {
        if (!prompt.trim()) {
            setError("Prompt cannot be empty.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResponse(null);

        try {
            // Call the Cloud Function to handle the Gemini API call securely
            const result = await api.testGeminiConnectivity(prompt);
            setResponse(result); 
        } catch (err: any) {
            console.error("Gemini API test failed (via Cloud Function):", err);
            // The error message comes from the Cloud Function now
            setError(err.message || "An unexpected error occurred during API test via Cloud Function.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Gemini API Connectivity Test (via Cloud Function)</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white text-3xl">&times;</button>
                </div>

                <div className="flex-grow p-4 overflow-y-auto">
                    {/* The API key selection UI is removed as it's now backend responsibility */}
                    <div className="bg-yellow-900 text-yellow-300 p-3 rounded-md mb-4 flex items-center justify-between">
                        <p className="text-sm">
                            API key management is now handled securely on the backend (Firebase Cloud Functions).
                            Ensure your Cloud Function is deployed and configured with a valid API key.
                            <br />
                            <a 
                                href="ai.google.dev/gemini-api/docs/billing" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="underline hover:text-yellow-100"
                            >
                                Billing documentation
                            </a>
                        </p>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="api-prompt" className="block text-sm font-medium text-gray-300 mb-2">Enter a prompt to test the API:</label>
                        <textarea
                            id="api-prompt"
                            rows={3}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            disabled={isLoading}
                        ></textarea>
                    </div>

                    {error && (
                        <div className="bg-red-900 text-red-300 p-3 rounded-md mb-4">
                            <p className="text-sm">Error: {error}</p>
                        </div>
                    )}

                    <div className="mb-4">
                        <h3 className="text-md font-bold text-white mb-2">API Response:</h3>
                        <div className="bg-gray-700 p-3 rounded-md min-h-[100px] text-gray-200 text-sm whitespace-pre-wrap">
                            {isLoading ? (
                                <div className="flex items-center text-blue-400">
                                    <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating response...
                                </div>
                            ) : (
                                response || 'No response yet.'
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-900 rounded-b-lg text-right border-t border-gray-700 flex justify-between items-center">
                    <button
                        onClick={handleTestApi}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Testing...' : 'Test API'}
                    </button>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

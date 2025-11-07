
import React from 'react';
import type { ReportEvent } from '../types';

interface ReportsProps {
    events: ReportEvent[];
    onEventClick: (event: ReportEvent) => void;
}

const SeverityBadge: React.FC<{ severity: ReportEvent['severity'] }> = ({ severity }) => {
    const classes = {
        Low: 'bg-blue-900 text-blue-300',
        Medium: 'bg-yellow-900 text-yellow-300',
        High: 'bg-orange-900 text-orange-300',
        Critical: 'bg-red-900 text-red-300',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${classes[severity]}`}>{severity}</span>;
}

export const Reports: React.FC<ReportsProps> = ({ events, onEventClick }) => {
    return (
        <div>
             <div className="mb-8">
                <h2 className="text-3xl font-bold text-white">Event Reports</h2>
                <p className="mt-1 text-md text-gray-400">
                    Browse and investigate all logged events from your analytics.
                </p>
            </div>

            <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timestamp</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Camera</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Analytic</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Severity</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">View</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {events.map(event => (
                                <tr key={event.id} className="hover:bg-gray-700 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(event.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{event.cameraName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{event.analyticName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <SeverityBadge severity={event.severity} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => onEventClick(event)} className="text-blue-400 hover:text-blue-300">View Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import type { ReportEvent, Camera } from '../types';

const StatCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
);

interface DashboardProps {
    events: ReportEvent[];
    cameras: Camera[];
}

// Fix: Define a type for the aggregated event data to help TypeScript's type inference.
type HourlyEventData = {
    name: string;
    Low: number;
    Medium: number;
    High: number;
    Critical: number;
};

export const Dashboard: React.FC<DashboardProps> = ({ events, cameras }) => {
    const onlineCameras = cameras.filter(c => c.status === 'Online' || c.status === 'Recording').length;
    const criticalEvents = events.filter(e => e.severity === 'Critical').length;
    const eventsToday = events.length;

    const eventData = events.reduce((acc, event) => {
        const hour = new Date(event.timestamp).getHours();
        const key = `${hour}:00`;
        if (!acc[key]) {
            acc[key] = { name: key, Low: 0, Medium: 0, High: 0, Critical: 0 };
        }
        acc[key][event.severity]++;
        return acc;
    }, {} as Record<string, HourlyEventData>);
    
    // Fix: Explicitly type the parameters of the sort function to resolve the 'unknown' type error.
    const chartData = Object.values(eventData).sort((a: HourlyEventData, b: HourlyEventData) => parseInt(a.name) - parseInt(b.name));

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Cameras" value={cameras.length} description={`${onlineCameras} online`} />
                <StatCard title="Events Today" value={eventsToday} description="Across all analytics" />
                <StatCard title="Critical Alerts" value={criticalEvents} description="Require immediate attention" />
                <StatCard title="System Health" value="99.8%" description="Powered by Google Cloud" />
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Event Frequency by Hour</h3>
                 <p className="text-sm text-gray-500 mb-6">This chart illustrates the architecture's capability to process and aggregate data for real-time reporting.</p>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                            <XAxis dataKey="name" stroke="#A0AEC0" />
                            <YAxis stroke="#A0AEC0" allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                            <Legend />
                            <Bar dataKey="Low" stackId="a" fill="#3182CE" />
                            <Bar dataKey="Medium" stackId="a" fill="#D69E2E" />
                            <Bar dataKey="High" stackId="a" fill="#F56565" />
                            <Bar dataKey="Critical" stackId="a" fill="#C53030" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
             <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Architectural Overview</h3>
                <p className="text-gray-400 leading-relaxed">
                    This system demonstrates a modern, scalable computer vision architecture.
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2 text-gray-300">
                    <li><strong className="text-blue-400">IP Camera Ingestion:</strong> The platform is designed to connect to standard IP cameras, capturing raw video streams.</li>
                    <li><strong className="text-blue-400">Cloud Processing Pipeline:</strong> Streams are securely transmitted to Google Cloud for processing.</li>
                    <li><strong className="text-blue-400">Vertex AI Vision Models:</strong> The core analytics (facial recognition, LPR, etc.) are performed by powerful, pre-trained or custom models hosted on Vertex AI. This allows for complex analysis at scale without requiring heavy on-premise hardware.</li>
                    <li><strong className="text-blue-400">Data Storage & Analysis:</strong> Detected events, metadata, and video clips are stored in services like Google Cloud Storage. BigQuery can be used for large-scale analysis and report generation.</li>
                    <li><strong className="text-blue-400">Real-time Dashboards:</strong> This web interface, built with React, serves as the user-friendly front-end, providing live monitoring, configuration, and reporting capabilities.</li>
                </ul>
                <p className="mt-4 text-green-400 font-semibold">
                    Conclusion: Yes, the technology to build such a robust and intelligent system is not only available but is mature and accessible through platforms like Google Cloud and Vertex AI.
                </p>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { Property, MaintenanceRequest, MaintenanceStatus, RentStatus, Tenant, AISuggestion } from '../types';
import { getTopSuggestions } from '../services/geminiService';
import { LightbulbIcon, LoadingSpinner } from './Icons';

interface DashboardProps {
  properties: Property[];
  maintenanceRequests: MaintenanceRequest[];
  tenants: Tenant[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ properties, maintenanceRequests, tenants }) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');

  const totalProperties = properties.length;
  const occupiedProperties = properties.filter(p => p.status === 'Occupied').length;
  const occupancyRate = totalProperties > 0 ? ((occupiedProperties / totalProperties) * 100).toFixed(0) : 0;
  const openMaintenance = maintenanceRequests.filter(m => m.status !== MaintenanceStatus.Completed).length;
  const rentOverdue = properties.filter(p => p.rentStatus === RentStatus.Overdue).length;

  const handleGenerateSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    setSuggestionError('');
    setSuggestions([]);
    try {
        const result = await getTopSuggestions(properties, maintenanceRequests, tenants);
        setSuggestions(result);
    } catch (error) {
        setSuggestionError('Sorry, we couldn\'t generate suggestions at this time. Please try again later.');
        console.error(error);
    } finally {
        setIsGeneratingSuggestions(false);
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Total Properties" value={totalProperties} description="Properties across all portfolios" />
        <StatCard title="Occupancy Rate" value={`${occupancyRate}%`} description={`${occupiedProperties} of ${totalProperties} properties occupied`} />
        <StatCard title="Open Maintenance" value={openMaintenance} description="Requests needing attention" />
        <StatCard title="Rent Overdue" value={rentOverdue} description="Properties with overdue rent" className={rentOverdue > 0 ? 'bg-red-50 dark:bg-red-900/20' : ''} />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Recent Maintenance Requests</h3>
            <div className="space-y-3">
                {maintenanceRequests.length > 0 ? maintenanceRequests.slice(0, 5).map(req => (
                    <div key={req.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                        <div>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{req.issue}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{req.propertyAddress}</p>
                        </div>
                         <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            req.status === MaintenanceStatus.New ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                            req.status === MaintenanceStatus.InProgress ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                            'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                        }`}>
                            {req.status}
                        </span>
                    </div>
                )) : (
                    <p className="text-sm text-center py-4 text-slate-400 dark:text-slate-500">No recent maintenance requests.</p>
                )}
            </div>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">AI-Powered Suggestions</h3>
            <div className="h-full">
                {isGeneratingSuggestions && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                        <LoadingSpinner className="h-8 w-8 mb-3 text-sky-600" />
                        <p className="font-medium">Analyzing your portfolio...</p>
                        <p className="text-xs">This might take a moment.</p>
                    </div>
                )}
                {suggestionError && (
                    <div className="flex flex-col items-center justify-center h-full text-red-500">
                         <p>{suggestionError}</p>
                         <button onClick={handleGenerateSuggestions} className="mt-2 text-sm text-sky-600 hover:underline">Try again</button>
                    </div>
                )}
                {!isGeneratingSuggestions && !suggestionError && suggestions.length > 0 && (
                    <div className="space-y-3 pr-2 overflow-y-auto max-h-56">
                        <ol className="list-decimal list-inside space-y-3">
                            {suggestions.map((s, index) => (
                                <li key={index} className="text-sm">
                                    <strong className="font-semibold text-slate-700 dark:text-slate-200">{s.title}</strong>
                                    <p className="text-slate-500 dark:text-slate-400 ml-1">{s.suggestion}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
                {!isGeneratingSuggestions && !suggestionError && suggestions.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                         <LightbulbIcon className="h-10 w-10 mb-3 text-slate-400 dark:text-slate-500" />
                        <p className="text-slate-600 dark:text-slate-300 font-medium">Get proactive advice</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">Let AI analyze your portfolio for insights.</p>
                        <button 
                            onClick={handleGenerateSuggestions}
                            className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 transition-colors text-sm"
                        >
                            Generate Suggestions
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
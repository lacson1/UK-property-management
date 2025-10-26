import React, { useState } from 'react';
import { Property, MaintenanceRequest, MaintenanceStatus, RentStatus, Tenant, Document, View } from '../types';
import { getPortfolioSummary } from '../services/geminiService';
import { InfoCircleIcon, LoadingSpinner } from './Icons';

interface DashboardProps {
  properties: Property[];
  maintenanceRequests: MaintenanceRequest[];
  tenants: Tenant[];
  documents: Document[];
  setCurrentView: (view: View) => void;
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

const getComplianceStatus = (expiryDate: string | null): { status: string, daysLeft: number | null, color: string } => {
    if (!expiryDate) return { status: 'Unknown', daysLeft: null, color: 'slate' };
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    now.setHours(0,0,0,0);
    expiry.setHours(0,0,0,0);

    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'Expired', daysLeft: diffDays, color: 'red' };
    if (diffDays <= 7) return { status: 'Urgent', daysLeft: diffDays, color: 'red' };
    if (diffDays <= 30) return { status: 'Expires Soon', daysLeft: diffDays, color: 'orange' };
    if (diffDays <= 60) return { status: 'Upcoming', daysLeft: diffDays, color: 'yellow' };
    return { status: 'Valid', daysLeft: diffDays, color: 'green' };
};


const ComplianceStatusWidget: React.FC<{ documents: Document[], setCurrentView: (view: View) => void }> = ({ documents, setCurrentView }) => {
    const statuses = {
        Urgent: 0,
        ExpiresSoon: 0,
        Upcoming: 0,
        Valid: 0,
    };

    documents.forEach(doc => {
        if (doc.expiryDate && typeof doc.expiryDate === 'string') {
            const { status } = getComplianceStatus(doc.expiryDate);
            if (status === 'Expired' || status === 'Urgent') statuses.Urgent++;
            else if (status === 'Expires Soon') statuses.ExpiresSoon++;
            else if (status === 'Upcoming') statuses.Upcoming++;
            else if (status === 'Valid') statuses.Valid++;
        }
    });

    const totalTracked = documents.filter(d => d.expiryDate && typeof d.expiryDate === 'string' && d.expiryDate !== 'extraction-failed').length;

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Compliance Status</h3>
                <button onClick={() => setCurrentView('documents')} className="text-sm text-sky-600 hover:underline">View All</button>
            </div>
            {totalTracked === 0 ? (
                 <div className="text-center py-4 text-slate-400 dark:text-slate-500">
                    <p>No documents with expiry dates found.</p>
                    <button onClick={() => setCurrentView('documents')} className="mt-2 text-sm text-sky-600 hover:underline">Upload a document to start tracking.</button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/20">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{statuses.Urgent}</p>
                        <p className="text-xs font-medium text-red-700 dark:text-red-300">Expired/Urgent</p>
                    </div>
                     <div className="p-2 rounded-md bg-orange-50 dark:bg-orange-900/20">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{statuses.ExpiresSoon}</p>
                        <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Expires in 30d</p>
                    </div>
                     <div className="p-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{statuses.Upcoming}</p>
                        <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Expires in 60d</p>
                    </div>
                     <div className="p-2 rounded-md bg-green-50 dark:bg-green-900/20">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statuses.Valid}</p>
                        <p className="text-xs font-medium text-green-700 dark:text-green-300">Valid</p>
                    </div>
                </div>
            )}
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ properties, maintenanceRequests, tenants, documents, setCurrentView }) => {
  const [summary, setSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const totalProperties = properties.length;
  const occupiedProperties = properties.filter(p => p.status === 'Occupied').length;
  const occupancyRate = totalProperties > 0 ? ((occupiedProperties / totalProperties) * 100).toFixed(0) : 0;
  const openMaintenance = maintenanceRequests.filter(m => m.status !== MaintenanceStatus.Completed).length;
  const rentOverdue = properties.filter(p => p.rentStatus === RentStatus.Overdue).length;

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryError('');
    setSummary('');
    try {
        const result = await getPortfolioSummary(properties, maintenanceRequests, tenants);
        setSummary(result);
    } catch (error) {
        setSummaryError('Sorry, we couldn\'t generate a summary at this time. Please try again later.');
    } finally {
        setIsGeneratingSummary(false);
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

      <div className="mt-8">
        <ComplianceStatusWidget documents={documents} setCurrentView={setCurrentView} />
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
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">AI Portfolio Summary</h3>
            <div className="h-full">
                {isGeneratingSummary && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                        <LoadingSpinner className="h-8 w-8 mb-3 text-sky-600" />
                        <p className="font-medium">Generating summary...</p>
                        <p className="text-xs">This might take a moment.</p>
                    </div>
                )}
                {summaryError && (
                    <div className="flex flex-col items-center justify-center h-full text-red-500">
                         <p>{summaryError}</p>
                         <button onClick={handleGenerateSummary} className="mt-2 text-sm text-sky-600 hover:underline">Try again</button>
                    </div>
                )}
                {!isGeneratingSummary && !summaryError && summary && (
                    <div className="space-y-3">
                        {summary.split('\n').filter(line => line.trim()).map((line, index) => {
                            const parts = line.split(':');
                            const label = parts[0];
                            const text = parts.slice(1).join(':').trim();
                            return (
                                <div key={index}>
                                    <strong className="font-semibold text-slate-700 dark:text-slate-200">{label}:</strong>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 inline ml-1">{text}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
                {!isGeneratingSummary && !summaryError && !summary && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                         <InfoCircleIcon className="h-10 w-10 mb-3 text-slate-400 dark:text-slate-500" />
                        <p className="text-slate-600 dark:text-slate-300 font-medium">Get a quick portfolio overview</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">Let AI create a 3-line summary of your portfolio.</p>
                        <button 
                            onClick={handleGenerateSummary}
                            className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 transition-colors text-sm"
                        >
                            Generate Summary
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
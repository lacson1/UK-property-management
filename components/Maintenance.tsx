import React, { useState, useRef } from 'react';
import { MaintenanceRequest, Property, Tradesperson, MaintenanceStatus } from '../types';
import { XIcon, PlusIcon, MaintenanceIcon, LoadingSpinner, SparkleIcon, DownloadIcon } from './Icons';
import { exportMaintenance } from '../services/exportService';

interface MaintenanceProps {
  maintenanceRequests: MaintenanceRequest[];
  properties: Property[];
  tradespeople: Tradesperson[];
  onAddRequest: (propertyId: string, issue: string) => Promise<void>;
  onUpdateRequest: (request: MaintenanceRequest) => void;
  onCompleteRequest: (request: MaintenanceRequest, cost: number, invoiceUrl: string | null) => void;
  fileToDataUrl: (file: File) => Promise<string>;
}

const ExportDropdown: React.FC<{ onExport: (format: 'csv' | 'pdf') => void }> = ({ onExport }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-md font-medium hover:bg-slate-700 transition-colors text-sm"
            >
                <DownloadIcon className="h-4 w-4" />
                Export
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-700 rounded-md shadow-lg z-10 border border-slate-200 dark:border-slate-600">
                    <button onClick={() => { onExport('csv'); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-t-md">
                        as CSV
                    </button>
                    <button onClick={() => { onExport('pdf'); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-b-md">
                        as PDF
                    </button>
                </div>
            )}
        </div>
    );
};

const AddRequestModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    properties: Property[];
    onAddRequest: (propertyId: string, issue: string) => Promise<void>;
}> = ({ isOpen, onClose, properties, onAddRequest }) => {
    const [propertyId, setPropertyId] = useState('');
    const [issue, setIssue] = useState('');
    const [isTriaging, setIsTriaging] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!propertyId || !issue.trim()) {
            setError('Please select a property and describe the issue.');
            return;
        }
        setIsTriaging(true);
        setError('');
        try {
            await onAddRequest(propertyId, issue);
            onClose();
        } catch (err) {
            setError('Failed to create request. Please try again.');
        } finally {
            setIsTriaging(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" role="document">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold">New Maintenance Request</h3>
                    <button onClick={onClose} disabled={isTriaging}><XIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="property" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Property</label>
                            <select id="property" value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" required>
                                <option value="" disabled>Select a property</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                            </select>
                        </div>
                        <div>
                             <label htmlFor="issue" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Issue Description</label>
                             <textarea id="issue" value={issue} onChange={e => setIssue(e.target.value)} rows={4} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" placeholder="e.g., The kitchen sink is leaking." required></textarea>
                        </div>
                    </div>
                    {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
                    <div className="mt-6 flex justify-end items-center gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600" disabled={isTriaging}>Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-slate-400 min-w-[150px] flex justify-center items-center" disabled={isTriaging}>
                           {isTriaging ? <><LoadingSpinner className="h-5 w-5 mr-2"/> Triaging...</> : <><SparkleIcon className="h-5 w-5 mr-2" /> Submit & Triage</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Maintenance: React.FC<MaintenanceProps> = ({ maintenanceRequests, properties, tradespeople, onAddRequest }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
    const handleExport = (format: 'csv' | 'pdf') => {
        exportMaintenance(maintenanceRequests, tradespeople, format);
    };

    const getStatusColor = (status: MaintenanceStatus) => {
        switch (status) {
            case MaintenanceStatus.New: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            case MaintenanceStatus.InProgress:
            case MaintenanceStatus.AwaitingQuote:
            case MaintenanceStatus.QuoteApproved:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            case MaintenanceStatus.WorkComplete: return 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300';
            case MaintenanceStatus.Completed: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            default: return 'bg-slate-100 text-slate-800';
        }
    };
    
    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Maintenance</h2>
                <div className="flex gap-2 flex-col sm:flex-row">
                    {maintenanceRequests.length > 0 && <ExportDropdown onExport={handleExport} />}
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 transition-colors">
                        <PlusIcon className="h-5 w-5" />
                        New Request
                    </button>
                </div>
            </div>
            
             {maintenanceRequests.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <MaintenanceIcon className="h-16 w-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                    <h3 className="text-xl font-semibold">No Maintenance Requests</h3>
                    <p className="text-slate-500 mt-2 mb-4">You're all caught up!</p>
                </div>
             ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Issue</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Property</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Urgency</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">AI Suggestion</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {maintenanceRequests.map(req => (
                                    <tr key={req.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{req.issue}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{req.propertyAddress}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{req.urgency}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{req.suggestedTradesperson}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <AddRequestModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                properties={properties}
                onAddRequest={onAddRequest}
            />
        </main>
    );
};

export default Maintenance;
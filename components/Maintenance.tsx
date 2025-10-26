import React, { useState } from 'react';
import { MaintenanceRequest, MaintenanceStatus, MaintenanceUrgency, Property } from '../types';
import { XIcon, SparkleIcon, LoadingSpinner } from './Icons';

interface MaintenanceProps {
  maintenanceRequests: MaintenanceRequest[];
  properties: Property[];
  onAddRequest: (propertyId: string, issue: string) => Promise<void>;
}

const UrgencyBadge: React.FC<{ urgency: MaintenanceUrgency }> = ({ urgency }) => {
    const urgencyClasses = {
        [MaintenanceUrgency.Low]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        [MaintenanceUrgency.Medium]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        [MaintenanceUrgency.High]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        [MaintenanceUrgency.Emergency]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${urgencyClasses[urgency] || 'bg-slate-100 text-slate-800'}`}>
            {urgency}
        </span>
    );
};

const StatusBadge: React.FC<{ status: MaintenanceStatus }> = ({ status }) => (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        status === MaintenanceStatus.New ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
        status === MaintenanceStatus.InProgress ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
        'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
    }`}>
        {status}
    </span>
);

const Maintenance: React.FC<MaintenanceProps> = ({ maintenanceRequests, properties, onAddRequest }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<string>(properties[0]?.id || '');
    const [issueDescription, setIssueDescription] = useState('');
    const [isTriaging, setIsTriaging] = useState(false);
    const [error, setError] = useState('');

    const formatCurrency = (amount: number) => {
        if (amount === 0) return '-';
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
    };

    const handleAddRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProperty || !issueDescription.trim()) {
            setError('Please select a property and describe the issue.');
            return;
        }

        setIsTriaging(true);
        setError('');

        try {
            await onAddRequest(selectedProperty, issueDescription);
            setIsModalOpen(false);
            setIssueDescription('');
            setSelectedProperty(properties[0]?.id || '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsTriaging(false);
        }
    };

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Maintenance Requests</h2>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 transition-colors">
          Add Request
        </button>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {maintenanceRequests.map(req => (
            <div key={req.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex justify-between items-start">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 pr-2">{req.issue}</p>
                    <StatusBadge status={req.status} />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{req.propertyAddress}</p>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <div className="text-slate-500 dark:text-slate-400">Urgency</div>
                        <div><UrgencyBadge urgency={req.urgency} /></div>
                    </div>
                    <div>
                        <div className="text-slate-500 dark:text-slate-400">Trade</div>
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{req.suggestedTradesperson}</div>
                    </div>
                    <div>
                        <div className="text-slate-500 dark:text-slate-400">Reported</div>
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{req.reportedDate}</div>
                    </div>
                    <div>
                        <div className="text-slate-500 dark:text-slate-400">Cost</div>
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{formatCurrency(req.cost)}</div>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Property</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Issue</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Urgency</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Suggested Trade</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Reported</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Cost</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {maintenanceRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{req.propertyAddress}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate" title={req.issue}>{req.issue}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><UrgencyBadge urgency={req.urgency} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{req.suggestedTradesperson}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{req.reportedDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={req.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{formatCurrency(req.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>

       {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[calc(100vh-2rem)]" role="document">
                    <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                        <h3 id="modal-title" className="text-xl font-semibold text-slate-800 dark:text-slate-100">New Maintenance Request</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        <form onSubmit={handleAddRequest} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="property" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Property</label>
                                    <select 
                                        id="property" 
                                        value={selectedProperty}
                                        onChange={(e) => setSelectedProperty(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                    >
                                        {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="issue" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Issue Description</label>
                                    <textarea 
                                        id="issue"
                                        rows={4}
                                        value={issueDescription}
                                        onChange={(e) => setIssueDescription(e.target.value)}
                                        placeholder="e.g., The boiler is making a loud banging noise and there's no hot water."
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                    />
                                </div>
                            </div>
                            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
                            <div className="mt-6 flex justify-end items-center gap-4">
                                 {isTriaging && (
                                    <div className="flex items-center text-sm text-sky-600 dark:text-sky-400 animate-pulse">
                                        <SparkleIcon className="h-4 w-4 mr-2" />
                                        AI Triage in progress...
                                    </div>
                                )}
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                                <button type="submit" disabled={isTriaging} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center">
                                    {isTriaging && <LoadingSpinner className="h-4 w-4 mr-2" />}
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}
    </main>
  );
};

export default Maintenance;
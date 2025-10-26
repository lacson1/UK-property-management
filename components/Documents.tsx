import React, { useState, useRef } from 'react';
import { Document, Property } from '../types';
import { UploadIcon, XIcon, PlusIcon, DocumentIcon as FileIcon, LoadingSpinner } from './Icons';

// Helper function to calculate compliance status
const getComplianceStatus = (expiryDate: string | null): { status: string; daysLeft: number | null; color: string } => {
    if (!expiryDate) return { status: 'N/A', daysLeft: null, color: 'slate' };

    const now = new Date();
    const expiry = new Date(expiryDate);
    now.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'Expired', daysLeft: diffDays, color: 'red' };
    if (diffDays <= 30) return { status: 'Expires Soon', daysLeft: diffDays, color: 'orange' };
    if (diffDays <= 60) return { status: 'Upcoming', daysLeft: diffDays, color: 'yellow' };
    return { status: 'Valid', daysLeft: diffDays, color: 'green' };
};

const StatusBadge: React.FC<{ expiryDate: string | null }> = ({ expiryDate }) => {
    const { status, color } = getComplianceStatus(expiryDate);
    const colorClasses: { [key: string]: string } = {
        red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        slate: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses[color]}`}>{status}</span>;
};

const UploadDocumentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    properties: Property[];
    onUpload: (propertyId: string, file: File) => Promise<void>;
}> = ({ isOpen, onClose, properties, onUpload }) => {
    const [selectedProperty, setSelectedProperty] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    
    const handleClose = () => {
        setSelectedFile(null);
        setSelectedProperty('');
        setError('');
        setIsUploading(false);
        onClose();
    }

    const handleUpload = async () => {
        if (!selectedFile || !selectedProperty) {
            setError('Please select a property and a file.');
            return;
        };
        setIsUploading(true);
        setError('');
        try {
            await onUpload(selectedProperty, selectedFile);
            handleClose();
        } catch (err) {
            setError('Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" role="document">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold">Upload New Document</h3>
                    <button onClick={handleClose} disabled={isUploading}><XIcon className="h-6 w-6" /></button>
                </div>
                 <div className="p-6 space-y-4">
                     <div>
                        <label htmlFor="property" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Property</label>
                        <select id="property" value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" required>
                            <option value="" disabled>Select a property</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                        </select>
                    </div>
                    <div>
                         <label htmlFor="file-upload" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Document File</label>
                         <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                               <FileIcon className="mx-auto h-12 w-12 text-slate-400" />
                               <div className="flex text-sm text-slate-600 dark:text-slate-400">
                                   <label htmlFor="file-upload-input" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-sky-600 hover:text-sky-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500">
                                       <span>Upload a file</span>
                                       <input id="file-upload-input" name="file-upload" type="file" className="sr-only" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} accept="image/*,application/pdf" />
                                   </label>
                                   <p className="pl-1">or drag and drop</p>
                               </div>
                               <p className="text-xs text-slate-500">PNG, JPG, PDF up to 10MB</p>
                               {selectedFile && <p className="text-sm pt-2 text-slate-800 dark:text-slate-200">Selected: {selectedFile.name}</p>}
                           </div>
                         </div>
                    </div>
                 </div>
                {error && <p className="text-red-600 text-sm px-6 pb-4">{error}</p>}
                <div className="mt-2 p-6 flex justify-end items-center gap-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                    <button type="button" onClick={handleUpload} disabled={isUploading || !selectedFile || !selectedProperty} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-slate-400 flex items-center min-w-[150px] justify-center">
                        {isUploading ? <LoadingSpinner className="h-5 w-5" /> : 'Upload & Analyze'}
                    </button>
                </div>
            </div>
        </div>
    );
};


interface DocumentsProps {
    documents: Document[];
    properties: Property[];
    onAddDocument: (propertyId: string, file: File) => Promise<void>;
}

const Documents: React.FC<DocumentsProps> = ({ documents, properties, onAddDocument }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const propertyMap = new Map(properties.map(p => [p.id, p.address]));

    const renderField = (value: string | null | 'extracting...') => {
        if (value === 'extracting...') {
            return <div className="flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400"><LoadingSpinner className="h-3 w-3" /> <span>Analyzing...</span></div>;
        }
        if (value === 'extraction-failed') {
            return <span className="text-red-500 text-xs">Failed</span>;
        }
        return value || <span className="text-slate-400 dark:text-slate-500">N/A</span>;
    }

    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Documents</h2>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 transition-colors">
                    <PlusIcon className="h-5 w-5" />
                    Upload Document
                </button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Document</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Property</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Expiry Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Compliance Status</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {documents.map(doc => (
                                <tr key={doc.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <a href={doc.fileDataUrl} target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">{doc.fileName}</a>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{propertyMap.get(doc.propertyId) || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{renderField(doc.documentType)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{renderField(doc.expiryDate)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge expiryDate={typeof doc.expiryDate === 'string' ? doc.expiryDate : null} /></td>
                                </tr>
                            ))}
                         </tbody>
                    </table>
                     {documents.length === 0 && (
                        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                            <FileIcon className="h-12 w-12 mx-auto mb-2"/>
                            <p>No documents found.</p>
                            <p className="text-sm">Upload a document to get started.</p>
                        </div>
                    )}
                </div>
            </div>

            <UploadDocumentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                properties={properties}
                onUpload={onAddDocument}
            />
        </main>
    );
};

export default Documents;

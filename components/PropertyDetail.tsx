import React, { useState, useRef } from 'react';
import { Property, MaintenanceRequest, Transaction, Document, RentStatus, Tenant } from '../types';
import { ArrowLeftIcon, UploadIcon, DocumentIcon, XIcon, LoadingSpinner, SparkleIcon, UsersIcon, CheckCircleIcon } from './Icons';

interface PropertyDetailProps {
  property: Property;
  maintenanceRequests: MaintenanceRequest[];
  transactions: Transaction[];
  documents: Document[];
  tenants: Tenant[];
  onBack: () => void;
  onAddDocument: (propertyId: string, file: File) => Promise<void>;
}

const UploadDocumentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File) => Promise<void>;
}> = ({ isOpen, onClose, onUpload }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            setError('');
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setSelectedFile(null);
            setPreview(null);
            setError('Please select an image file (e.g., PNG, JPG).');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        setIsSuccess(false);
        setError('');
        try {
            await onUpload(selectedFile);
            setIsSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (err) {
            setError('Upload failed. Please try again.');
            setIsUploading(false);
        }
    };
    
    const handleClose = () => {
        setSelectedFile(null);
        setPreview(null);
        setError('');
        setIsUploading(false);
        setIsSuccess(false);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg p-6" role="document">
                <div className="flex justify-between items-center mb-4">
                    <h3 id="modal-title" className="text-xl font-semibold text-slate-800 dark:text-slate-100">Upload Document</h3>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50" disabled={isUploading}>
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div 
                        className={`border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center transition-colors ${
                            isUploading || isSuccess ? 'cursor-not-allowed bg-slate-50 dark:bg-slate-700/50' : 'cursor-pointer hover:border-sky-500 dark:hover:border-sky-400'
                        }`}
                        onClick={() => !(isUploading || isSuccess) && fileInputRef.current?.click()}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isUploading || isSuccess} />
                        {preview ? (
                            <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-md" />
                        ) : (
                            <div className="text-slate-500 dark:text-slate-400">
                                <UploadIcon className="h-10 w-10 mx-auto mb-2" />
                                <p>Click to browse or drag & drop an image file here.</p>
                                <p className="text-xs mt-1">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        )}
                    </div>
                    {selectedFile && !isSuccess && <p className="text-sm text-center text-slate-600 dark:text-slate-300">Selected: {selectedFile.name}</p>}
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                </div>
                 <div className="mt-6 flex justify-end items-center gap-4">
                    {isSuccess ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                            <CheckCircleIcon className="h-5 w-5" />
                            <span>Upload successful!</span>
                        </div>
                    ) : (
                        <>
                            <button type="button" onClick={handleClose} disabled={isUploading} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50">Cancel</button>
                            <button type="button" onClick={handleUpload} disabled={!selectedFile || isUploading} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center w-44">
                                {isUploading ? (
                                    <>
                                        <LoadingSpinner className="h-4 w-4 mr-2" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <UploadIcon className="h-4 w-4 mr-2" />
                                        Upload & Analyze
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, maintenanceRequests, transactions, documents, tenants, onBack, onAddDocument }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const currentTenant = tenants.find(t => t.propertyId === property.id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
  };

  const renderExpiryDate = (doc: Document) => {
      if (doc.expiryDate === 'extracting...') {
          return <div className="flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400"><LoadingSpinner className="h-3 w-3" /> <span>Analyzing...</span></div>;
      }
      if (doc.expiryDate === 'extraction-failed' || !doc.expiryDate) {
          return <span className="text-xs text-slate-500">N/A</span>;
      }
      return <span className="font-mono text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{doc.expiryDate}</span>;
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <button onClick={onBack} className="text-sky-600 dark:text-sky-400 hover:underline text-sm mb-4 flex items-center gap-2">
        <ArrowLeftIcon className="h-4 w-4" /> Back to all properties
      </button>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">{property.address}</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">{property.type} Portfolio</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Finance */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Property & Tenant Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Status</p>
                <p className="font-medium text-slate-700 dark:text-slate-200">{property.status}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Rent Status</p>
                <p className={`font-medium ${property.rentStatus === RentStatus.Overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>{property.rentStatus}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Current Rent</p>
                <p className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(property.currentRent)}/month</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-3">Current Tenant</h4>
                {currentTenant ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400">Name</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{currentTenant.name}</p>
                        </div>
                         <div>
                            <p className="text-slate-500 dark:text-slate-400">Lease End</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{currentTenant.leaseEndDate}</p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-slate-500 dark:text-slate-400">Contact</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{currentTenant.email}</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{currentTenant.phone}</p>
                        </div>
                         <div className="sm:col-span-2">
                            <p className="text-slate-500 dark:text-slate-400">Deposit</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(currentTenant.depositAmount)} ({currentTenant.depositScheme})</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-400 dark:text-slate-500 py-4">
                        <UsersIcon className="h-8 w-8 mx-auto mb-2"/>
                        <p>This property is vacant.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
        {/* Right Column: Maintenance & Documents */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Maintenance History</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {maintenanceRequests.length > 0 ? maintenanceRequests.map(req => (
                    <div key={req.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                        <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{req.issue}</p>
                        <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">{req.reportedDate}</p>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            req.status === 'New' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                            req.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                            'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                        }`}>
                            {req.status}
                        </span>
                        </div>
                    </div>
                    )) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No maintenance requests.</p>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Documents</h3>
                    <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-1.5 text-sm bg-sky-600 text-white px-3 py-1.5 rounded-md font-medium hover:bg-sky-700 transition-colors">
                        <UploadIcon className="h-4 w-4" /> Upload
                    </button>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {documents.length > 0 ? documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <DocumentIcon className="h-6 w-6 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                                <div className="overflow-hidden">
                                    <a href={doc.fileDataUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sky-700 dark:text-sky-400 hover:underline truncate block" title={doc.fileName}>
                                        {doc.fileName}
                                    </a>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Expiry Date:</p>
                                        {renderExpiryDate(doc)}
                                    </div>
                                </div>
                            </div>
                            <div className="relative group ml-2">
                                {doc.expiryDate && doc.expiryDate !== 'extracting...' && doc.expiryDate !== 'extraction-failed' && (
                                   <>
                                    <SparkleIcon className="h-4 w-4 text-sky-500" />
                                     <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 text-xs text-white bg-slate-700 dark:bg-slate-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        Date extracted by AI
                                    </span>
                                   </>
                                )}
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No documents uploaded.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
      <UploadDocumentModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUpload={(file) => onAddDocument(property.id, file)} 
      />
    </main>
  );
};

export default PropertyDetail;
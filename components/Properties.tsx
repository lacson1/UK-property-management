import React, { useState, useRef } from 'react';
import { Property, PropertyStatus, PropertyType, RentStatus } from '../types';
import { XIcon, PlusIcon, PropertiesIcon, DownloadIcon } from './Icons';
import { exportProperties } from '../services/exportService';

interface PropertiesProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  onAddProperty: (propertyData: Omit<Property, 'id' | 'rentStatus'>) => void;
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

const AddPropertyModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAddProperty: (propertyData: Omit<Property, 'id' | 'rentStatus'>) => void;
}> = ({ isOpen, onClose, onAddProperty }) => {
    const [address, setAddress] = useState('');
    const [type, setType] = useState<PropertyType>(PropertyType.Personal);
    const [status, setStatus] = useState<PropertyStatus>(PropertyStatus.Vacant);
    const [currentRent, setCurrentRent] = useState<number | ''>('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!address.trim() || !currentRent) {
            setError('Please fill out all required fields.');
            return;
        }
        onAddProperty({
            address,
            type,
            status,
            currentRent: Number(currentRent),
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" role="document">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Add New Property</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Property Address</label>
                            <input type="text" id="address" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Portfolio Type</label>
                                <select id="type" value={type} onChange={e => setType(e.target.value as PropertyType)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500">
                                    {Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Initial Status</label>
                                <select id="status" value={status} onChange={e => setStatus(e.target.value as PropertyStatus)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500">
                                    {Object.values(PropertyStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="rent" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Current Rent (£ per month)</label>
                            <input type="number" id="rent" value={currentRent} onChange={e => setCurrentRent(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" required />
                        </div>
                    </div>
                    {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
                    <div className="mt-6 flex justify-end items-center gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">Add Property</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Properties: React.FC<PropertiesProps> = ({ properties, onSelectProperty, onAddProperty }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleExport = (format: 'csv' | 'pdf') => {
        exportProperties(properties, format);
    };

    const getStatusColor = (status: PropertyStatus) => {
        switch (status) {
            case PropertyStatus.Occupied: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case PropertyStatus.Vacant: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            case PropertyStatus.UnderOffer: return 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
        }
    };
    
    const getRentStatusColor = (status: RentStatus) => {
        if (status === RentStatus.Overdue) return 'text-red-600 dark:text-red-400';
        return 'text-slate-600 dark:text-slate-300';
    };

    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Properties</h2>
                <div className="flex gap-2 flex-col sm:flex-row">
                    {properties.length > 0 && <ExportDropdown onExport={handleExport} />}
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 transition-colors">
                        <PlusIcon className="h-5 w-5" />
                        Add Property
                    </button>
                </div>
            </div>

            {properties.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <PropertiesIcon className="h-16 w-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                    <h3 className="text-xl font-semibold">No Properties Found</h3>
                    <p className="text-slate-500 mt-2 mb-4">Get started by adding your first property.</p>
                     <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 transition-colors mx-auto">
                        <PlusIcon className="h-5 w-5" />
                        Add Property
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Address</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Rent Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Rent</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {properties.map((property) => (
                                    <tr key={property.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{property.address}</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">{property.type}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(property.status)}`}>
                                                {property.status}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getRentStatusColor(property.rentStatus)}`}>
                                            {property.rentStatus}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                            £{property.currentRent.toLocaleString()}/mo
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => onSelectProperty(property)} className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200">View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <AddPropertyModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddProperty={onAddProperty}
            />
        </main>
    );
};

export default Properties;
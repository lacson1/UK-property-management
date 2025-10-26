import React, { useState, useRef } from 'react';
import { Property, Transaction, TransactionType } from '../types';
import { XIcon, PlusIcon, FinanceIcon, DownloadIcon } from './Icons';
import { exportTransactions } from '../services/exportService';

interface FinanceProps {
  properties: Property[];
  transactions: Transaction[];
  onAddTransaction: (newTransaction: Omit<Transaction, 'id' | 'propertyAddress'>) => void;
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

const AddTransactionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    properties: Property[];
    onAddTransaction: (newTransaction: Omit<Transaction, 'id' | 'propertyAddress'>) => void;
}> = ({ isOpen, onClose, properties, onAddTransaction }) => {
    const [propertyId, setPropertyId] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.Expense);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!propertyId || !description.trim() || !amount) {
            setError('Please fill out all required fields.');
            return;
        }
        onAddTransaction({
            propertyId,
            type,
            description,
            amount: Number(amount),
            date,
        });
        onClose();
    };
    
    const handleClose = () => {
        // Reset form state
        setPropertyId('');
        setType(TransactionType.Expense);
        setDescription('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" role="document">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold">Add Transaction</h3>
                    <button onClick={handleClose}><XIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="property" className="block text-sm font-medium">Property</label>
                            <select id="property" value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" required>
                                <option value="" disabled>Select a property</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium">Type</label>
                            <select id="type" value={type} onChange={e => setType(e.target.value as TransactionType)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500">
                                {Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="description" className="block text-sm font-medium">Description</label>
                            <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" required />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium">Amount (£)</label>
                                <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" required />
                            </div>
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium">Date</label>
                                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" required />
                            </div>
                        </div>
                    </div>
                    {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
                    <div className="mt-6 flex justify-end items-center gap-4">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium rounded-md bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">Add Transaction</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Finance: React.FC<FinanceProps> = ({ properties, transactions, onAddTransaction }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleExport = (format: 'csv' | 'pdf') => {
        exportTransactions(transactions, format);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
    };

    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Finance</h2>
                <div className="flex gap-2 flex-col sm:flex-row">
                    {transactions.length > 0 && <ExportDropdown onExport={handleExport} />}
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 transition-colors">
                        <PlusIcon className="h-5 w-5" />
                        Add Transaction
                    </button>
                </div>
            </div>

            {transactions.length === 0 ? (
                 <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <FinanceIcon className="h-16 w-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                    <h3 className="text-xl font-semibold">No Transactions Logged</h3>
                    <p className="text-slate-500 mt-2 mb-4">Start by adding an income or expense record.</p>
                 </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Property</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {transactions.map(tx => (
                                    <tr key={tx.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{tx.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{tx.propertyAddress}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{tx.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.type === TransactionType.Income ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${tx.type === TransactionType.Income ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {tx.type === TransactionType.Expense ? '-' : ''}{formatCurrency(tx.amount)}
                                        </td>
                                    </tr>
                                ))}
                             </tbody>
                        </table>
                    </div>
                </div>
            )}

            <AddTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                properties={properties}
                onAddTransaction={onAddTransaction}
            />
        </main>
    );
};

export default Finance;
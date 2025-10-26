import React, { useState } from 'react';
import { Tradesperson } from '../types';
import { XIcon, PlusIcon, WrenchIcon } from './Icons';

interface AddTradespersonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTradesperson: (tradespersonData: Omit<Tradesperson, 'id'>) => void;
}

const AddTradespersonModal: React.FC<AddTradespersonModalProps> = ({ isOpen, onClose, onAddTradesperson }) => {
    const [name, setName] = useState('');
    const [trade, setTrade] = useState('');
    const [contact, setContact] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !trade.trim() || !contact.trim()) {
            setError('Please fill out all fields.');
            return;
        }
        onAddTradesperson({ name, trade, contact });
        onClose();
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" role="document">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold">Add New Tradesperson</h3>
                    <button onClick={onClose}><XIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Name</label>
                            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., John Smith" className="w-full p-2 border rounded-md" required />
                        </div>
                        <div>
                            <label htmlFor="trade" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Trade</label>
                            <input type="text" id="trade" value={trade} onChange={e => setTrade(e.target.value)} placeholder="e.g., Plumber, Electrician" className="w-full p-2 border rounded-md" required />
                        </div>
                        <div>
                            <label htmlFor="contact" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Contact (Phone or Email)</label>
                            <input type="text" id="contact" value={contact} onChange={e => setContact(e.target.value)} placeholder="e.g., 07123456789" className="w-full p-2 border rounded-md" required />
                        </div>
                    </div>
                    {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
                    <div className="mt-6 flex justify-end items-center gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-slate-100">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">Add Tradesperson</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface TradespeopleProps {
  tradespeople: Tradesperson[];
  onAddTradesperson: (tradespersonData: Omit<Tradesperson, 'id'>) => void;
}

const Tradespeople: React.FC<TradespeopleProps> = ({ tradespeople, onAddTradesperson }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Tradespeople</h2>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 transition-colors">
            <PlusIcon className="h-5 w-5" />
            Add Tradesperson
        </button>
      </div>
      
      {tradespeople.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <WrenchIcon className="h-16 w-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
            <h3 className="text-xl font-semibold">No Tradespeople Yet</h3>
            <p className="text-slate-500 mt-2 mb-4">Add your trusted contacts to assign them to jobs.</p>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 transition-colors mx-auto">
                <PlusIcon className="h-5 w-5" />
                Add Tradesperson
            </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Trade</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Contact</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {tradespeople.map((person) => (
                    <tr key={person.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{person.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{person.trade}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{person.contact}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
      )}

      <AddTradespersonModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTradesperson={onAddTradesperson}
      />
    </main>
  );
};

export default Tradespeople;
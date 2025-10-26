import React, { useState } from 'react';
import { Tenant, Property, DepositScheme, PropertyStatus } from '../types';
import { XIcon, PlusIcon, UsersIcon } from './Icons';

interface TenantsProps {
  tenants: Tenant[];
  properties: Property[];
  onAddTenant: (tenantData: Omit<Tenant, 'id' | 'propertyAddress'>) => void;
}

const AddTenantModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    properties: Property[];
    tenants: Tenant[];
    onAddTenant: (tenantData: Omit<Tenant, 'id' | 'propertyAddress'>) => void;
}> = ({ isOpen, onClose, properties, tenants, onAddTenant }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyId, setPropertyId] = useState('');
    const [leaseStartDate, setLeaseStartDate] = useState('');
    const [leaseEndDate, setLeaseEndDate] = useState('');
    const [depositAmount, setDepositAmount] = useState<number | ''>('');
    const [depositScheme, setDepositScheme] = useState<DepositScheme>(DepositScheme.TDS);
    const [error, setError] = useState('');

    const tenantedPropertyIds = tenants.map(t => t.propertyId);
    const availableProperties = properties.filter(p => !tenantedPropertyIds.includes(p.id) && p.status !== PropertyStatus.UnderOffer);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !propertyId || !leaseStartDate || !leaseEndDate || !depositAmount) {
            setError('Please fill out all required fields.');
            return;
        }
        onAddTenant({
            name,
            email,
            phone,
            propertyId,
            leaseStartDate,
            leaseEndDate,
            depositAmount: Number(depositAmount),
            depositScheme,
        });
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[calc(100vh-2rem)]" role="document">
                <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Add New Tenant</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Full Name</label>
                                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" required />
                                </div>
                                 <div>
                                    <label htmlFor="property" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Property</label>
                                    <select id="property" value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" required>
                                        <option value="" disabled>Select a property</option>
                                        {availableProperties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Email Address</label>
                                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Phone Number</label>
                                    <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" />
                                </div>
                                 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="leaseStart" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Lease Start Date</label>
                                        <input type="date" id="leaseStart" value={leaseStartDate} onChange={e => setLeaseStartDate(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" required />
                                    </div>
                                    <div>
                                        <label htmlFor="leaseEnd" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Lease End Date</label>
                                        <input type="date" id="leaseEnd" value={leaseEndDate} onChange={e => setLeaseEndDate(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" required />
                                    </div>
                                </div>
                                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <div>
                                        <label htmlFor="depositAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Deposit Amount (£)</label>
                                        <input type="number" id="depositAmount" value={depositAmount} onChange={e => setDepositAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" required />
                                    </div>
                                    <div>
                                        <label htmlFor="depositScheme" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Deposit Scheme</label>
                                        <select id="depositScheme" value={depositScheme} onChange={e => setDepositScheme(e.target.value as DepositScheme)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500" required>
                                            {Object.values(DepositScheme).map(scheme => <option key={scheme} value={scheme}>{scheme}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                         {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
                        <div className="mt-6 flex justify-end items-center gap-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">Add Tenant</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}


const Tenants: React.FC<TenantsProps> = ({ tenants, properties, onAddTenant }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Tenants</h2>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 transition-colors">
            <PlusIcon className="h-5 w-5" />
            Add Tenant
        </button>
      </div>

      {/* Mobile card view */}
       <div className="md:hidden space-y-4">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="font-semibold text-slate-900 dark:text-slate-100">{tenant.name}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{tenant.propertyAddress}</div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2 text-sm">
                 <div>
                    <div className="text-slate-500 dark:text-slate-400">Contact</div>
                    <div className="text-slate-800 dark:text-slate-200 font-medium">{tenant.email}</div>
                    <div className="text-slate-800 dark:text-slate-200 font-medium">{tenant.phone}</div>
                </div>
                 <div>
                    <div className="text-slate-500 dark:text-slate-400">Lease End</div>
                    <div className="text-slate-800 dark:text-slate-200 font-medium">{tenant.leaseEndDate}</div>
                </div>
            </div>
          </div>
        ))}
        {tenants.length === 0 && (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                <UsersIcon className="h-12 w-12 mx-auto mb-2" />
                No tenants found.
            </div>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Property</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Lease End</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{tenant.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{tenant.propertyAddress}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                         <div>{tenant.email}</div>
                         <div>{tenant.phone}</div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{tenant.leaseEndDate}</td>
                  </tr>
                ))}
                 {tenants.length === 0 && (
                    <tr>
                        <td colSpan={4} className="text-center py-10 text-slate-500 dark:text-slate-400">
                            <UsersIcon className="h-12 w-12 mx-auto mb-2" />
                            No tenants found.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
        </div>
      </div>
      <AddTenantModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        properties={properties}
        tenants={tenants}
        onAddTenant={onAddTenant}
      />
    </main>
  );
};

export default Tenants;
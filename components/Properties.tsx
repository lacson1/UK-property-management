import React from 'react';
import { Property, PropertyStatus, RentStatus } from '../types';
import { ArrowRightIcon } from './Icons';

interface PropertiesProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}

const RentStatusBadge: React.FC<{ status: RentStatus }> = ({ status }) => {
    const statusClasses = {
        [RentStatus.Paid]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        [RentStatus.Overdue]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        [RentStatus.PartiallyPaid]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    };
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status] || 'bg-slate-100 text-slate-800'}`}>
            {status}
        </span>
    );
};

const PropertyStatusBadge: React.FC<{ status: PropertyStatus }> = ({ status }) => {
    const statusClasses = {
        [PropertyStatus.Occupied]: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
        [PropertyStatus.Vacant]: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
        [PropertyStatus.UnderOffer]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    };
     return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>
            {status}
        </span>
    );
}

const Properties: React.FC<PropertiesProps> = ({ properties, onSelectProperty }) => {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">Properties</h2>
      
      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {properties.map(property => (
          <div key={property.id} onClick={() => onSelectProperty(property)} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 cursor-pointer">
            <div className="flex justify-between items-start">
              <div className="font-semibold text-slate-900 dark:text-slate-100">{property.address}</div>
              <button onClick={() => onSelectProperty(property)} className="text-sky-600 dark:text-sky-400 flex-shrink-0 ml-2">
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                    <div className="text-slate-500 dark:text-slate-400">Type</div>
                    <div className="text-slate-800 dark:text-slate-200 font-medium">{property.type}</div>
                </div>
                 <div>
                    <div className="text-slate-500 dark:text-slate-400">Rent</div>
                    <div className="text-slate-800 dark:text-slate-200 font-medium">£{property.currentRent.toLocaleString()}/mo</div>
                </div>
                <div>
                    <div className="text-slate-500 dark:text-slate-400">Status</div>
                    <div><PropertyStatusBadge status={property.status} /></div>
                </div>
                <div>
                    <div className="text-slate-500 dark:text-slate-400">Rent Status</div>
                    <div><RentStatusBadge status={property.rentStatus} /></div>
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Rent Status</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Rent</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {properties.map((property) => (
                  <tr key={property.id} onClick={() => onSelectProperty(property)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{property.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{property.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><PropertyStatusBadge status={property.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><RentStatusBadge status={property.rentStatus} /></td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">£{property.currentRent.toLocaleString()}/mo</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => onSelectProperty(property)} className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 flex items-center gap-1">
                        View Details <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </main>
  );
};

export default Properties;
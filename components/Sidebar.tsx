import React from 'react';
import { View } from '../types';
import { DashboardIcon, PropertiesIcon, MaintenanceIcon, GuidanceIcon, FinanceIcon, SunIcon, MoonIcon, UsersIcon, XIcon, WrenchIcon, DocumentIcon, ChartBarIcon } from './Icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'properties', label: 'Properties', icon: PropertiesIcon },
  { id: 'tenants', label: 'Tenants', icon: UsersIcon },
  { id: 'maintenance', label: 'Maintenance', icon: MaintenanceIcon },
  { id: 'documents', label: 'Documents', icon: DocumentIcon },
  { id: 'tradespeople', label: 'Tradespeople', icon: WrenchIcon },
  { id: 'finance', label: 'Finance', icon: FinanceIcon },
  { id: 'reports', label: 'Reports', icon: ChartBarIcon },
  { id: 'guidance', label: 'AI Guidance', icon: GuidanceIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, theme, toggleTheme, isOpen, onClose }) => {
  const handleViewChange = (view: View) => {
    setCurrentView(view);
    onClose(); // Close sidebar on navigation in mobile
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-40
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">PropManage UK</h1>
          <button onClick={onClose} className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="Close menu">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <ul>
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleViewChange(item.id as View)}
                    className={`w-full flex items-center px-4 py-2.5 my-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {theme === 'light' ? <MoonIcon className="h-5 w-5 mr-3" /> : <SunIcon className="h-5 w-5 mr-3" />}
            Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
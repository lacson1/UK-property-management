import React from 'react';
import { MenuIcon } from './Icons';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-20 lg:hidden h-16 flex items-center justify-between px-4 bg-white/75 dark:bg-slate-900/75 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
      <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">PropManage UK</h1>
      <button
        onClick={onMenuClick}
        className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        aria-label="Open menu"
      >
        <MenuIcon className="h-6 w-6" />
      </button>
    </header>
  );
};

export default Header;

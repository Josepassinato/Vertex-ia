
import React from 'react';
import type { Page } from '../types';
import { DashboardIcon, CameraIcon, AnalyticsIcon, ReportsIcon } from '../constants';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface NavItemProps {
  icon: React.FC<{className?: string}>;
  label: Page;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    <span className="truncate">{label}</span>
  </button>
);

const SidebarContent: React.FC<{ currentPage: Page; setCurrentPage: (page: Page) => void; }> = ({ currentPage, setCurrentPage }) => {
  const navItems: { label: Page; icon: React.FC<{className?: string}> }[] = [
    { label: 'Dashboard', icon: DashboardIcon },
    { label: 'Cameras', icon: CameraIcon },
    { label: 'Analytics', icon: AnalyticsIcon },
    { label: 'Reports', icon: ReportsIcon },
  ];

  return (
    <div className="flex flex-col w-64 bg-gray-800 border-r border-gray-700 h-full">
      <div className="flex items-center justify-center h-20 border-b border-gray-700 flex-shrink-0">
        <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h1 className="ml-3 text-xl font-bold text-white">Vertex Vision</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isActive={currentPage === item.label}
            onClick={() => setCurrentPage(item.label)}
          />
        ))}
      </nav>
       <div className="px-4 py-4 border-t border-gray-700 mt-auto flex-shrink-0">
        <p className="text-xs text-center text-gray-500">
          Powered by Google Vertex AI
        </p>
      </div>
    </div>
  );
};


export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, setIsOpen }) => {
    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:flex-shrink-0">
                <SidebarContent currentPage={currentPage} setCurrentPage={setCurrentPage} />
            </div>

            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => setIsOpen(false)}></div>
                
                {/* Content */}
                <div className={`relative flex transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <SidebarContent currentPage={currentPage} setCurrentPage={setCurrentPage} />
                </div>
            </div>
        </>
    );
};

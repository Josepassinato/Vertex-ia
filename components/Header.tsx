
import React from 'react';
import type { Page } from '../types';
import type { User } from 'firebase/auth'; // Import User type directly from firebase/auth

interface HeaderProps {
    currentPage: Page;
    setSidebarOpen: (isOpen: boolean) => void;
    onLogout: () => void; // Add logout prop
    currentUser: User | null; // Use Firebase's User type
}

const MenuIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);


export const Header: React.FC<HeaderProps> = ({ currentPage, setSidebarOpen, onLogout, currentUser }) => {
    return (
        <header className="bg-gray-800 shadow-md">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                         <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-400 hover:text-white mr-4"
                            aria-label="Open sidebar"
                        >
                            <MenuIcon className="h-6 w-6" />
                        </button>
                        <h1 className="text-2xl font-semibold text-white">{currentPage}</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        {currentUser && (
                            <span className="text-sm text-gray-300 hidden sm:block">
                                {currentUser.email}
                            </span>
                        )}
                        <button
                            onClick={onLogout}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-1.5 px-3 rounded-md transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ children }) {
    return (
        <div className="flex h-screen w-full bg-background overflow-hidden relative font-sans">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 z-10 overflow-hidden relative">
                <div className="flex-shrink-0">
                    <Navbar />
                </div>
                <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
}
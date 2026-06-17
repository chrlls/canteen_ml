import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 lg:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
            {/* Left spacer for mobile hamburger menu in Sidebar */}
            <div className="w-10 lg:hidden" />

            <h2 className="text-base font-semibold text-foreground truncate">
                Welcome, <span className="text-primary font-bold">{user?.name}</span> <span className="text-xl inline-block ml-1">👋</span>
            </h2>

            <div className="flex items-center gap-4">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
                    {user?.role}
                </span>
            </div>
        </header>
    );
}
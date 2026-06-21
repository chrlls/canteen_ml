import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { cn } from '../../lib/utils';
import { TrendingUp, Menu, X } from 'lucide-react';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const { clearCart } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        clearCart();
        navigate('/');
    };

    const adminLinks = [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/menu', label: 'Menu' },
        { to: '/orders', label: 'Orders' },
        { to: '/inventory', label: 'Inventory' },
        { to: '/reports', label: 'Reports' },
        { to: '/users', label: 'User Management' },
    ];

    const cashierLinks = [
        { to: '/orders', label: 'POS Orders' },
        { to: '/menu', label: 'Menu' },
        { to: '/inventory', label: 'Inventory' },
    ];

    const customerLinks = [
        { to: '/orders', label: 'Order Food' },
        { to: '/history', label: 'Purchase History' },
    ];

    const links = user?.role === 'admin' ? adminLinks
        : user?.role === 'cashier' ? cashierLinks
            : customerLinks;

    const SidebarContent = () => (
        <div className="flex flex-col h-full w-64 bg-slate-950 text-slate-50 font-sans border-r border-slate-800 shadow-xl">
            {/* Brand Header */}
            <div className="px-6 py-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center shrink-0 shadow-lg shadow-black/20">
                        <TrendingUp className="text-warning" size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-tight">
                            Can<span className="text-primary">Predict</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
                            {user?.role} Panel
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {links.map((link) => {
                    const isActive = location.pathname === link.to;
                    return (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                                isActive
                                    ? "bg-primary/15 text-white"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            {link.label}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-md" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="p-5 border-t border-white/10 bg-slate-950/50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shadow-md shadow-primary/20 shrink-0">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">
                            {user?.name || 'User'}
                        </div>
                        <div className="text-[11px] text-slate-400 capitalize truncate">
                            {user?.role}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className="lg:hidden fixed top-3 left-3 z-50 p-2 text-foreground flex items-center justify-center"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <div className={cn(
                "lg:hidden fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <SidebarContent />
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block flex-shrink-0 h-full">
                <SidebarContent />
            </div>
        </>
    );
}
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

function Sidebar() {
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
        { to: '/dashboard', icon: '📊', label: 'Dashboard' },
        { to: '/menu', icon: '🍔', label: 'Menu' },
        { to: '/orders', icon: '📋', label: 'Orders' },
        { to: '/inventory', icon: '📦', label: 'Inventory' },
        { to: '/reports', icon: '📈', label: 'Reports' },
        { to: '/users', icon: '👥', label: 'User Management' },
    ];

    const cashierLinks = [
        { to: '/orders', icon: '📋', label: 'POS Orders' },
        { to: '/menu', icon: '🍔', label: 'Menu' },
        { to: '/inventory', icon: '📦', label: 'Inventory' },
    ];

   const customerLinks = [
        { to: '/menu', icon: '🍔', label: 'Browse Menu' },
        { to: '/orders', icon: '🛒', label: 'Place Order' },
        { to: '/history', icon: '📋', label: 'Purchase History' },
    ];
 
    const links = user?.role === 'admin' ? adminLinks
        : user?.role === 'cashier' ? cashierLinks
        : customerLinks;

    const SidebarContent = () => (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                .sb-wrap {
                    background: #1c1c2e !important;
                    color: white;
                    width: 256px;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Poppins', sans-serif;
                }
                .sb-brand {
                    padding: 1.5rem 1.25rem 1.2rem;
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                }
                .sb-brand h1 {
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .sb-brand h1 span.icon {
                    width: 38px; height: 38px;
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.1rem;
                    box-shadow: 0 4px 12px rgba(231,76,60,0.4);
                }
                .sb-brand p {
                    font-size: 0.65rem;
                    color: rgba(255,255,255,0.35);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-top: 6px;
                    font-weight: 500;
                }
                .sb-nav {
                    flex: 1;
                    padding: 1rem 0.75rem;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .sb-nav-label {
                    font-size: 0.6rem;
                    font-weight: 700;
                    color: rgba(255,255,255,0.22);
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    padding: 0.5rem 0.65rem 0.3rem;
                }
                .sb-link {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 0.65rem 0.85rem;
                    border-radius: 10px;
                    text-decoration: none;
                    color: rgba(255,255,255,0.5);
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.18s;
                    position: relative;
                }
                .sb-link:hover {
                    background: rgba(255,255,255,0.07);
                    color: rgba(255,255,255,0.85);
                }
                .sb-link.active {
                    background: rgba(231,76,60,0.18);
                    color: #ffffff;
                }
                .sb-link.active::before {
                    content: '';
                    position: absolute; left: 0; top: 20%; bottom: 20%;
                    width: 3px; border-radius: 0 3px 3px 0;
                    background: #e74c3c;
                }
                .sb-footer {
                    padding: 1rem 1.25rem 1.25rem;
                    border-top: 1px solid rgba(255,255,255,0.07);
                }
                .sb-user-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 0.85rem;
                }
                .sb-avatar {
                    width: 34px; height: 34px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.75rem; font-weight: 700; color: #fff;
                    flex-shrink: 0;
                    box-shadow: 0 2px 8px rgba(231,76,60,0.35);
                }
                .sb-user-name {
                    font-size: 0.82rem; font-weight: 600; color: #fff;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .sb-user-role {
                    font-size: 0.63rem; color: rgba(255,255,255,0.35);
                    text-transform: capitalize;
                }
                .sb-logout-btn {
                    width: 100%;
                    background: rgba(231,76,60,0.15);
                    border: 1px solid rgba(231,76,60,0.25);
                    color: #ff8a80;
                    padding: 0.6rem;
                    border-radius: 10px;
                    font-family: 'Poppins', sans-serif;
                    font-size: 0.82rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.18s, color 0.18s;
                }
                .sb-logout-btn:hover {
                    background: rgba(231,76,60,0.3);
                    color: #fff;
                }
            `}</style>

            <div className="sb-wrap">
                <div className="sb-brand">
                    <h1><span className="icon">🍽️</span> Canteen</h1>
                    <p>{user?.role} Panel</p>
                </div>

                <nav className="sb-nav">
                    <div className="sb-nav-label">Navigation</div>
                    {links.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setMobileOpen(false)}
                            className={`sb-link${location.pathname === link.to ? ' active' : ''}`}
                        >
                            <span>{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="sb-footer">
                    <div className="sb-user-row">
                        <div className="sb-avatar">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{flex:1, overflow:'hidden'}}>
                            <div className="sb-user-name">{user?.name}</div>
                            <div className="sb-user-role">{user?.role}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="sb-logout-btn">
                        🚪 Logout
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-2 rounded-lg shadow-lg"
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{ background: '#1c1c2e', fontFamily: 'Poppins, sans-serif' }}
            >
                {mobileOpen ? '✕' : '☰'}
            </button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <div className={`lg:hidden fixed top-0 left-0 z-40 h-full transform transition-transform duration-300
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent />
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block flex-shrink-0">
                <SidebarContent />
            </div>
        </>
    );
}

export default Sidebar;
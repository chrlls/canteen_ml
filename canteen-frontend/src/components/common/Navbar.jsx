import React from 'react';
import { useAuth } from '../../context/AuthContext';

function Navbar() {
    const { user } = useAuth();

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                .nb-bar {
                    position: sticky; top: 0; z-index: 30;
                    background: rgba(255,255,255,0.92) !important;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-bottom: 1px solid #ebebeb;
                    box-shadow: 0 1px 12px rgba(0,0,0,0.05);
                    padding: 0 1.5rem;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-family: 'Poppins', sans-serif;
                }
                .nb-spacer { width: 40px; }
                .nb-greeting {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #555;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .nb-greeting span {
                    color: #e74c3c;
                    font-weight: 700;
                }
                .nb-badge {
                    background: rgba(231,76,60,0.1);
                    color: #e74c3c;
                    padding: 0.28rem 0.85rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: capitalize;
                    letter-spacing: 0.02em;
                    white-space: nowrap;
                }
            `}</style>

            <div className="nb-bar">
                {/* Left spacer for mobile hamburger */}
                <div className="nb-spacer lg:hidden" />

                <h2 className="nb-greeting">
                    Welcome, <span>{user?.name}</span> 👋
                </h2>
                <span className="nb-badge">
                    {user?.role}
                </span>
            </div>
        </>
    );
}

export default Navbar;
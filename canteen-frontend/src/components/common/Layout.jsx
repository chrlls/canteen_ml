import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

function Layout({ children }) {
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                .ly-root {
                    display: flex;
                    height: 100vh;
                    overflow: hidden;
                    background: #ececec !important;
                    font-family: 'Poppins', sans-serif;
                    position: relative;
                }
                /* Subtle bg accent matching Login blobs */
                .ly-root::before {
                    content: '';
                    position: fixed; inset: 0;
                    background:
                        radial-gradient(ellipse 55% 45% at 95% 5%, rgba(231,76,60,0.05) 0%, transparent 65%),
                        radial-gradient(ellipse 45% 40% at 5% 95%, rgba(231,76,60,0.04) 0%, transparent 65%);
                    pointer-events: none; z-index: 0;
                }
                .ly-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    min-width: 0;
                    position: relative;
                    z-index: 1;
                }
                .ly-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                    animation: pageIn 0.35s ease both;
                }
                @media (min-width: 1024px) {
                    .ly-content { padding: 1.5rem; }
                }
                @keyframes pageIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                /* scrollbar */
                .ly-content::-webkit-scrollbar { width: 5px; }
                .ly-content::-webkit-scrollbar-track { background: transparent; }
                .ly-content::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 8px; }
                .ly-content::-webkit-scrollbar-thumb:hover { background: rgba(231,76,60,0.3); }
            `}</style>

            <div className="ly-root">
                <Sidebar />
                <div className="ly-main">
                    <div className="flex-shrink-0">
                        <Navbar />
                    </div>
                    <div className="ly-content">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Layout;
import React from 'react';

function LoadingSpinner() {
    return (
        <>
            <style>{`
                .ls-wrap {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    padding: 5rem 0;
                }
                .ls-ring {
                    width: 48px; height: 48px;
                    border: 4px solid rgba(231,76,60,0.15);
                    border-top-color: #e74c3c;
                    border-radius: 50%;
                    animation: spin 0.75s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
            <div className="ls-wrap">
                <div className="ls-ring" />
            </div>
        </>
    );
}

export default LoadingSpinner;
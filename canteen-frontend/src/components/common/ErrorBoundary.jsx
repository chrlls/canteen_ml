import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <>
                    <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                        .eb-wrap {
                            display: flex; align-items: center; justify-content: center;
                            height: 100vh; background: #ececec;
                            font-family: 'Poppins', sans-serif;
                        }
                        .eb-card {
                            background: #fff; border-radius: 20px;
                            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                            padding: 2.5rem 3rem; text-align: center;
                            border: 1px solid #f0f0f0;
                        }
                        .eb-icon { font-size: 3rem; margin-bottom: 1rem; }
                        .eb-title { font-size: 1.25rem; font-weight: 700; color: #e74c3c; margin-bottom: 0.5rem; }
                        .eb-sub   { font-size: 0.85rem; color: #aaa; margin-bottom: 1.5rem; }
                        .eb-btn {
                            background: linear-gradient(135deg, #e74c3c, #c0392b);
                            color: #fff; border: none;
                            padding: 0.7rem 2rem; border-radius: 12px;
                            font-family: 'Poppins', sans-serif;
                            font-size: 0.9rem; font-weight: 600;
                            cursor: pointer; transition: opacity 0.18s;
                            box-shadow: 0 4px 14px rgba(231,76,60,0.35);
                        }
                        .eb-btn:hover { opacity: 0.88; }
                    `}</style>
                    <div className="eb-wrap">
                        <div className="eb-card">
                            <div className="eb-icon">⚠️</div>
                            <h2 className="eb-title">Something went wrong.</h2>
                            <p className="eb-sub">An unexpected error occurred. Please try again.</p>
                            <button
                                className="eb-btn"
                                onClick={() => this.setState({ hasError: false })}
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
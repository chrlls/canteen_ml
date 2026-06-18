import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        if (!email || !password) {
            setError('Please fill in all fields.');
            setLoading(false);
            return;
        }
        try {
            const user = await login(email, password);
            if (user.role === 'admin') navigate('/dashboard');
            else if (user.role === 'cashier') navigate('/orders');
            else navigate('/menu');
        } catch (err) {
            setError('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                .lp-root {
                    min-height: 100vh;
                    font-family: 'Poppins', sans-serif;
                    background: #e8e8e8;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    overflow: hidden;
                }
                .lp-bg {
                    position: absolute; inset: 0; z-index: 0;
                    background: #e8e8e8; overflow: hidden;
                }
                .lp-bg::before {
                    content: '';
                    position: absolute; top: -120px; left: -120px;
                    width: 500px; height: 500px;
                    background: radial-gradient(circle, rgba(231,76,60,0.12) 0%, transparent 70%);
                    border-radius: 50%;
                }
                .lp-bg::after {
                    content: '';
                    position: absolute; bottom: -100px; right: -100px;
                    width: 450px; height: 450px;
                    background: radial-gradient(circle, rgba(231,76,60,0.09) 0%, transparent 70%);
                    border-radius: 50%;
                }
                .lp-dots {
                    position: absolute; inset: 0;
                    background-image: radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px);
                    background-size: 28px 28px;
                    opacity: 0.6;
                }
                .lp-food-left {
                    position: absolute; left: -60px; top: 50%;
                    transform: translateY(-55%);
                    width: 360px; height: 360px; border-radius: 50%;
                    background: radial-gradient(circle at 40% 35%, #f8c471 0%, #e8a030 20%, #c0392b 40%, #922b21 60%, #784212 80%, #5d4037 100%);
                    box-shadow: 8px 12px 40px rgba(0,0,0,0.2);
                    overflow: hidden; z-index: 1;
                    animation: bowlFloat 8s ease-in-out infinite;
                }
                .lp-food-left::before {
                    content: ''; position: absolute; inset: 12px; border-radius: 50%;
                    background: radial-gradient(circle at 35% 30%, #f9e4b7 0%, #f0c060 15%, #e07030 30%, #c84b20 50%, #8b3a0f 70%, #5a2d0a 100%);
                }
                .lp-food-left::after {
                    content: '🥗'; position: absolute; top: 50%; left: 50%;
                    transform: translate(-50%, -50%); font-size: 120px;
                    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); z-index: 2;
                }
                .lp-food-right {
                    position: absolute; right: -40px; top: 50%;
                    transform: translateY(-45%);
                    width: 320px; height: 320px; border-radius: 50%;
                    background: radial-gradient(circle at 45% 40%, #a9cce3 0%, #5dade2 25%, #2e86c1 50%, #1a5276 75%);
                    box-shadow: -8px 12px 40px rgba(0,0,0,0.18);
                    overflow: hidden; z-index: 1;
                    animation: bowlFloat 9s ease-in-out infinite reverse;
                    animation-delay: 1s;
                }
                .lp-food-right::after {
                    content: '🍜'; position: absolute; top: 50%; left: 50%;
                    transform: translate(-50%, -50%); font-size: 100px;
                    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
                }
                .lp-food-tl { position:absolute; top:6%; left:18%; font-size:3rem; opacity:0.55; animation:leafSpin 12s linear infinite; z-index:1; filter:drop-shadow(2px 4px 6px rgba(0,0,0,0.15)); }
                .lp-food-tr { position:absolute; top:8%; right:18%; font-size:2.5rem; opacity:0.5; animation:leafSpin 15s linear infinite reverse; z-index:1; }
                .lp-food-bl { position:absolute; bottom:15%; left:22%; font-size:2rem; opacity:0.45; animation:leafSpin 10s linear infinite; z-index:1; }
                .lp-food-br { position:absolute; bottom:12%; right:20%; font-size:2.2rem; opacity:0.45; animation:leafSpin 13s linear infinite reverse; z-index:1; }
                @keyframes bowlFloat { 0%,100%{transform:translateY(-55%) rotate(0deg)} 50%{transform:translateY(-50%) rotate(3deg)} }
                @keyframes leafSpin  { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
                .lp-main {
                    position: relative; z-index: 2; flex: 1;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    padding: 2rem 1rem; min-height: 100vh;
                }
                .lp-logo {
                    display: flex; flex-direction: column; align-items: center;
                    margin-bottom: 1rem;
                    animation: dropIn 0.6s cubic-bezier(0.16,1,0.3,1) both;
                }
                .lp-logo-circle {
                    width: 72px; height: 72px;
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 2rem;
                    box-shadow: 0 6px 20px rgba(231,76,60,0.45), 0 0 0 4px rgba(231,76,60,0.15), 0 0 0 8px rgba(231,76,60,0.07);
                    border: 3px solid #fff;
                    margin-bottom: 0.6rem;
                }
                .lp-logo-name {
                    font-size: 0.72rem; font-weight: 700; color: #666;
                    letter-spacing: 0.18em; text-transform: uppercase;
                }
                @keyframes dropIn { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
                .lp-card {
                    width: 100%; max-width: 400px;
                    background: #ffffff;
                    border-radius: 24px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.04);
                    padding: 2.5rem 2.5rem 2.25rem;
                    animation: cardUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both;
                    position: relative; overflow: hidden;
                }
                .lp-card::before {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
                    background: linear-gradient(90deg, #e74c3c, #ff8a80, #e74c3c);
                    background-size: 200% 100%;
                    animation: shimmerBar 3s linear infinite;
                }
                @keyframes shimmerBar { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                @keyframes cardUp { from{opacity:0;transform:translateY(28px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
                .lp-card-title {
                    font-size: 2rem; font-weight: 800; color: #1a1a2e;
                    text-align: center; margin-bottom: 6px; letter-spacing: -0.5px;
                }
                .lp-card-sub {
                    font-size: 0.8rem; color: #999; text-align: center;
                    font-weight: 400; margin-bottom: 1.75rem; line-height: 1.6;
                }
                .lp-card-sub span {
                    color: #e74c3c; font-weight: 700;
                    background: rgba(231,76,60,0.08); padding: 0 5px; border-radius: 4px;
                }
                .lp-divider {
                    display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;
                }
                .lp-divider-line { flex: 1; height: 1px; background: #f0f0f0; }
                .lp-divider-text {
                    font-size: 0.67rem; color: #ccc; font-weight: 600;
                    text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap;
                }
                .lp-error {
                    background: #fff0ef; border: 1px solid #ffc5c0; border-radius: 10px;
                    padding: 0.65rem 1rem; font-size: 0.8rem; color: #c0392b; font-weight: 500;
                    margin-bottom: 1rem; text-align: center; animation: shake 0.4s ease;
                    display: flex; align-items: center; gap: 7px; justify-content: center;
                }
                @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
                .lp-field { margin-bottom: 1rem; }
                .lp-field-label {
                    display: block; font-size: 0.7rem; font-weight: 700; color: #888;
                    text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 0.4rem;
                }
                .lp-input-wrap {
                    position: relative; display: flex; align-items: center;
                    background: #f5f5f5; border: 1.5px solid #ebebeb; border-radius: 12px;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; overflow: hidden;
                }
                .lp-input-wrap.focused {
                    border-color: #e74c3c; background: #fff;
                    box-shadow: 0 0 0 3px rgba(231,76,60,0.1);
                }
                .lp-input-icon {
                    padding: 0 0.75rem 0 1rem; color: #ccc; flex-shrink: 0;
                    display: flex; align-items: center; transition: color 0.2s;
                }
                .lp-input-wrap.focused .lp-input-icon { color: #e74c3c; }
                .lp-input {
                    flex: 1; border: none; background: transparent;
                    padding: 0.9rem 0.5rem 0.9rem 0;
                    font-family: 'Poppins', sans-serif; font-size: 0.875rem;
                    font-weight: 400; color: #1a1a2e; outline: none;
                }
                .lp-input::placeholder { color: #bbb; font-weight: 300; }
                .lp-eye {
                    background: none; border: none; cursor: pointer;
                    padding: 0 1rem 0 0.5rem; color: #ccc;
                    display: flex; align-items: center; transition: color 0.18s; flex-shrink: 0;
                }
                .lp-eye:hover { color: #e74c3c; }
                .lp-meta {
                    display: flex; align-items: center; justify-content: space-between;
                    margin-bottom: 1.5rem; margin-top: 0.25rem;
                }
                .lp-remember {
                    display: flex; align-items: center; gap: 6px;
                    font-size: 0.75rem; color: #888; cursor: pointer; user-select: none;
                }
                .lp-remember input[type="checkbox"] { width:14px; height:14px; accent-color:#e74c3c; cursor:pointer; }
                .lp-forgot {
                    font-size: 0.75rem; color: #e74c3c; background: none; border: none;
                    cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600;
                    padding: 0; transition: opacity 0.18s;
                }
                .lp-forgot:hover { opacity: 0.7; }
                .lp-btn {
                    width: 100%; padding: 1rem;
                    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                    color: #fff; border: none; border-radius: 14px;
                    font-family: 'Poppins', sans-serif; font-size: 0.9rem; font-weight: 700;
                    letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer;
                    transition: transform 0.18s, box-shadow 0.18s;
                    box-shadow: 0 6px 22px rgba(231,76,60,0.42);
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    position: relative; overflow: hidden;
                }
                .lp-btn::after {
                    content: ''; position: absolute; inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
                    pointer-events: none;
                }
                .lp-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(231,76,60,0.5); }
                .lp-btn:active:not(:disabled) { transform: translateY(0); }
                .lp-btn:disabled { opacity: 0.55; cursor: not-allowed; }
                .lp-spin {
                    width: 15px; height: 15px;
                    border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
                    border-radius: 50%; animation: spin 0.7s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .lp-features {
                    display: flex; justify-content: center; gap: 0.5rem;
                    margin: 1.25rem 0 0.1rem; flex-wrap: wrap;
                }
                .lp-feature-pill {
                    display: flex; align-items: center; gap: 4px;
                    background: #f7f7f7; border: 1px solid #eee; border-radius: 20px;
                    padding: 0.28rem 0.75rem; font-size: 0.68rem; color: #888; font-weight: 500;
                }
                .lp-register-row {
                    text-align: center; margin-top: 1.25rem;
                    font-size: 0.78rem; color: #aaa; font-weight: 400;
                }
                .lp-register-row a { color: #e74c3c; font-weight: 700; text-decoration: none; transition: opacity 0.18s; }
                .lp-register-row a:hover { opacity: 0.75; }
                .lp-nav {
                    position: relative; z-index: 2;
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 1rem 2.5rem 1.25rem;
                    background: rgba(255,255,255,0.65); backdrop-filter: blur(8px);
                    border-top: 1px solid rgba(0,0,0,0.05);
                }
                .lp-nav-links { display: flex; gap: 1.5rem; }
                .lp-nav-link {
                    font-size: 0.75rem; color: #888; background: none; border: none;
                    cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 500;
                    padding: 0; transition: color 0.18s;
                }
                .lp-nav-link:hover { color: #e74c3c; }
                .lp-nav-copy { font-size: 0.7rem; color: #bbb; }
                @media (max-width: 480px) {
                    .lp-food-left  { width: 220px; height: 220px; left: -50px; }
                    .lp-food-right { width: 180px; height: 180px; right: -40px; }
                    .lp-food-tl, .lp-food-tr, .lp-food-bl, .lp-food-br { display: none; }
                    .lp-card { padding: 2rem 1.5rem 1.75rem; }
                    .lp-nav  { padding: 0.75rem 1.25rem; flex-direction: column; gap: 0.5rem; }
                    .lp-nav-links { gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
                    .lp-features  { display: none; }
                }
            `}</style>

            <div className="lp-root">
                <div className="lp-bg">
                    <div className="lp-dots" />
                    <div className="lp-food-left" />
                    <div className="lp-food-right" />
                    <span className="lp-food-tl">🌿</span>
                    <span className="lp-food-tr">🫑</span>
                    <span className="lp-food-bl">🍋</span>
                    <span className="lp-food-br">🌶️</span>
                </div>

                <div className="lp-main">
                    <div className="lp-logo">
                        <div className="lp-logo-circle">🍽️</div>
                        <span className="lp-logo-name">Canteen System</span>
                    </div>

                    <div className="lp-card">
                        <div className="lp-card-title">Login</div>
                        <div className="lp-card-sub">
                            More than <span>100+ meals</span> from our canteen every day
                        </div>

                        <div className="lp-divider">
                            <div className="lp-divider-line" />
                            <span className="lp-divider-text">Sign in to continue</span>
                            <div className="lp-divider-line" />
                        </div>

                        {error && <div className="lp-error">⚠️ {error}</div>}

                        <form onSubmit={handleLogin}>
                            <div className="lp-field">
                                <label className="lp-field-label">Email Address</label>
                                <div className={`lp-input-wrap ${focused === 'email' ? 'focused' : ''}`}>
                                    <span className="lp-input-icon">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                                        </svg>
                                    </span>
                                    <input
                                        type="email"
                                        className="lp-input"
                                        placeholder="Enter Email Id here..."
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        onFocus={() => setFocused('email')}
                                        onBlur={() => setFocused('')}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="lp-field">
                                <label className="lp-field-label">Password</label>
                                <div className={`lp-input-wrap ${focused === 'password' ? 'focused' : ''}`}>
                                    <span className="lp-input-icon">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                        </svg>
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="lp-input"
                                        placeholder="Enter your password..."
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        onFocus={() => setFocused('password')}
                                        onBlur={() => setFocused('')}
                                        required
                                    />
                                    <button type="button" className="lp-eye" onClick={() => setShowPassword(p => !p)}>
                                        {showPassword ? (
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                                            </svg>
                                        ) : (
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="lp-meta">
                                <label className="lp-remember">
                                    <input type="checkbox" /> Remember me
                                </label>
                                <button type="button" className="lp-forgot" onClick={() => {}}>Forgot Password?</button>
                            </div>

                            <button type="submit" className="lp-btn" disabled={loading}>
                                {loading ? <><div className="lp-spin" /> Signing in…</> : '🔐 LOGIN'}
                            </button>
                        </form>

                        <div className="lp-features">
                            <span className="lp-feature-pill">🍽️ 100+ Meals</span>
                            <span className="lp-feature-pill">⚡ Fast Orders</span>
                            <span className="lp-feature-pill">🔒 Secure</span>
                        </div>

                        <div className="lp-register-row">
                            Don't have an account? <Link to="/register">Register here</Link>
                        </div>
                    </div>
                </div>

                <div className="lp-nav">
                    <div className="lp-nav-links">
                        <button type="button" className="lp-nav-link">Explore</button>
                        <button type="button" className="lp-nav-link">What</button>
                        <button type="button" className="lp-nav-link">Help &amp; Feedback</button>
                        <button type="button" className="lp-nav-link">Contact</button>
                    </div>
                    <span className="lp-nav-copy">© {new Date().getFullYear()} Canteen System. All rights reserved.</span>
                </div>
            </div>
        </>
    );
}
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import ForecastPanel from './ForecastPanel';

export default function Login() {
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [error, setError]               = useState('');
    const [loading, setLoading]           = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe]     = useState(false); // TODO: wire to persistent session once backend supports it

    const { login }  = useAuth();
    const navigate   = useNavigate();

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
            if (user.role === 'admin')        navigate('/dashboard');
            else if (user.role === 'cashier') navigate('/orders');
            else                              navigate('/orders');
        } catch {
            setError('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        /* ── Page shell ─────────────────────────────────────────────────────── */
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            {/*
              ── Two-panel frame ────────────────────────────────────────────────
              Left: login form  |  Right: ForecastPanel (hidden below md breakpoint)
            */}
            <div
                className="w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-[20px] border border-border"
                style={{
                    maxWidth: '1040px',
                    minHeight: '640px',
                    boxShadow:
                        '0 1px 2px rgba(26,34,56,0.04), 0 24px 48px -16px rgba(26,34,56,0.16)',
                }}
            >
                {/* ── LEFT: Login form ──────────────────────────────────────── */}
                <div className="bg-background flex flex-col px-10 py-14 md:px-14">

                    {/* Brand mark */}
                    <div className="flex items-center gap-2.5 mb-14">
                        <div className="w-[34px] h-[34px] rounded-lg bg-foreground flex items-center justify-center shrink-0">
                            <TrendingUp className="text-warning" size={18} strokeWidth={2} />
                        </div>
                        <span className="font-bold text-[16.5px] tracking-tight text-foreground">
                            Can<span className="text-primary">Predict</span>
                        </span>
                    </div>

                    {/* Form heading */}
                    <div className="mb-9">
                        <span className="block text-[12px] font-semibold tracking-[0.08em] uppercase text-primary mb-2.5">
                            Canteen forecasting system
                        </span>
                        <h1 className="text-[30px] font-bold leading-[1.15] tracking-tight text-foreground mb-2">
                            Sign in to your dashboard
                        </h1>
                        <p className="text-[14.5px] text-muted-foreground leading-relaxed max-w-[360px]">
                            Check today's demand forecast, manage menu items, and review prediction accuracy.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="flex flex-col gap-[18px] flex-1">

                        {/* Inline error */}
                        {error && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
                                {error}
                            </div>
                        )}

                        {/* Email field */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="email"
                                className="text-[12.5px] font-semibold text-foreground tracking-[0.01em]"
                            >
                                Email address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@umindanao.edu.ph"
                                autoComplete="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="h-[46px] bg-muted border-border text-[14.5px] placeholder:text-muted-foreground/60"
                            />
                        </div>

                        {/* Password field */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="password"
                                className="text-[12.5px] font-semibold text-foreground tracking-[0.01em]"
                            >
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="h-[46px] bg-muted border-border text-[14.5px] pr-11 placeholder:text-muted-foreground/60"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPassword(p => !p)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword
                                        ? <EyeOff size={17} strokeWidth={1.6} />
                                        : <Eye    size={17} strokeWidth={1.6} />
                                    }
                                </Button>
                            </div>
                        </div>

                        {/* Remember me + Forgot password row */}
                        <div className="flex items-center justify-between text-[13.5px]">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground">
                                <Checkbox
                                    id="remember-me"
                                    checked={rememberMe}
                                    onCheckedChange={checked => setRememberMe(!!checked)}
                                />
                                Remember me
                            </label>
                            <button
                                type="button"
                                className="text-primary font-semibold hover:underline text-[13.5px] bg-transparent border-none p-0 cursor-pointer"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit button */}
                        <Button
                            type="submit"
                            className="w-full h-[50px] mt-1.5 text-[14.5px] font-semibold tracking-[0.01em]"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span
                                        className="inline-block w-4 h-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground"
                                        style={{ animation: 'spin 0.7s linear infinite' }}
                                    />
                                    Signing in…
                                </span>
                            ) : (
                                'Sign in'
                            )}
                        </Button>

                        {/* Register link */}
                        <div className="mt-auto pt-7 text-[13.5px] text-muted-foreground">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="text-foreground font-semibold no-underline border-b border-primary"
                            >
                                Register here
                            </Link>
                        </div>
                    </form>
                </div>

                {/* ── RIGHT: Forecast panel (hidden on small screens) ──────── */}
                <div className="hidden md:block h-full">
                    <ForecastPanel />
                </div>
            </div>
        </div>
    );
}
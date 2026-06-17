import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Mail, Lock, User, AlertCircle, Loader2, Utensils } from 'lucide-react';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.password_confirmation) {
            setError('Passwords do not match!');
            return;
        }

        setLoading(true);
        try {
            await api.post('/register', { ...form, role: 'customer' });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg mb-4">
                        <Utensils className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Canteen System</h1>
                    <p className="text-sm text-muted-foreground mt-1">Create an account to order meals</p>
                </div>

                <Card className="border-border/50 shadow-xl backdrop-blur-sm bg-card/95">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-xl">Register</CardTitle>
                        <CardDescription>
                            Join the Canteen System today
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm font-medium p-3 rounded-md mb-6 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Juan dela Cruz"
                                        className="pl-10"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="juan@school.edu"
                                        className="pl-10"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Min. 8 characters"
                                        className="pl-10"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        placeholder="Repeat your password"
                                        className="pl-10"
                                        value={form.password_confirmation}
                                        onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:underline font-semibold">
                                Sign in here
                            </Link>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="mt-8 text-center text-xs text-muted-foreground/60">
                    © {new Date().getFullYear()} Canteen System. All rights reserved.
                </div>
            </div>
        </div>
    );
}
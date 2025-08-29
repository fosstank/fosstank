// Fosstank: 24/7 live streaming platform
// Copyright (C) 2025 Pierre Morrel

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

'use client';
import { useContext, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { pb, User } from "@/lib/pocketbase";
import { UserContext } from "@/app/providers";
import { toast } from "./toaster";

interface LoginPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess?: () => void;
}

export default function LoginPanel({ isOpen, onClose, onLoginSuccess }: LoginPanelProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const { setUser } = useContext(UserContext);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (isLogin) {
            pb.collection('users').authWithPassword(formData.username, formData.password)
                .then((response) => {
                    // Clear form on successful login
                    setFormData({
                        email: '',
                        password: '',
                        confirmPassword: '',
                        username: ''
                    });
                    setUser(response.record as User);
                    onLoginSuccess?.();
                    setIsLoading(false);
                })
                .catch(() => {
                    toast.error('Login failed. Please check your credentials and try again.');
                    setIsLoading(false);
                });
            return;
        }

        // TODO: Registration logic
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4 w-8 h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full flex items-center justify-center border border-zinc-700 z-10 transition-colors"
                >
                    ×
                </button>

                <div className="relative mb-6">
                    <h1 className="text-3xl font-bold text-center text-cyan-500 uppercase tracking-wider py-4 [text-shadow:0_0_10px_theme(colors.cyan.500/40)]">
                        <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 mix-blend-overlay"></span>
                        {isLogin ? 'Log In' : 'Create Account'}
                    </h1>
                </div>

                <Card className="relative bg-zinc-950/95 backdrop-blur-sm">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/25 to-purple-500/25 rounded-sm blur-[2px]"></div>
                    <div className="relative">
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <button
                                    type="button"
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-3 px-4 rounded-sm transition-colors border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500/50 flex items-center justify-center gap-3"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    {isLogin ? 'Log In with Google' : 'Sign Up with Google'}
                                </button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-zinc-800" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-zinc-950 px-2 text-zinc-500">Or</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-2">
                                            Username or Email
                                        </label>
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            required
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className="w-full bg-zinc-900 text-zinc-300 px-4 py-3 rounded-sm border border-zinc-800 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 placeholder-zinc-600 transition-colors"
                                            placeholder={isLogin ? "Enter your username or email" : "Choose a username"}
                                        />
                                    </div>
                                    {!isLogin && (
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full bg-zinc-900 text-zinc-300 px-4 py-3 rounded-sm border border-zinc-800 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 placeholder-zinc-600 transition-colors"
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full bg-zinc-900 text-zinc-300 px-4 py-3 rounded-sm border border-zinc-800 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 placeholder-zinc-600 transition-colors"
                                            placeholder={isLogin ? "Enter your password" : "Choose a password"}
                                        />
                                    </div>

                                    {!isLogin && (
                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300 mb-2">
                                                Confirm Password
                                            </label>
                                            <input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type="password"
                                                required
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                className="w-full bg-zinc-900 text-zinc-300 px-4 py-3 rounded-sm border border-zinc-800 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 placeholder-zinc-600 transition-colors"
                                                placeholder="Confirm your password"
                                            />
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-zinc-900 font-bold py-3 px-4 rounded-sm transition-colors uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Authenticating...' : 'Access System'}
                                </button>

                                <div className="text-center space-y-3">
                                    {isLogin && (
                                        <a
                                            href="#"
                                            className="text-sm text-zinc-400 hover:text-cyan-500 transition-colors"
                                        >
                                            Forgot your credentials?
                                        </a>
                                    )}
                                    <div className="text-sm text-zinc-500">
                                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                                        <button
                                            type="button"
                                            onClick={() => setIsLogin(!isLogin)}
                                            className="text-cyan-500 hover:text-cyan-400 transition-colors font-medium"
                                        >
                                            {isLogin ? 'Create Account' : 'Sign In'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </div>
                </Card>
            </div>
        </div>
    );
}
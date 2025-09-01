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
import { pb, User } from "@/lib/pocketbase";
import { UserContext } from "@/app/providers";
import { toast } from "./toaster";
import FloatingPanel from "./floating-panel";

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

        // Registration logic
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters long.');
            setIsLoading(false);
            return;
        }

        const userData = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            passwordConfirm: formData.confirmPassword,
            emailVisibility: false,
        };

        pb.collection('users').create(userData)
            .then(() => {
                toast.success('Account created successfully! Please log in.');
                // Switch to login mode and clear form
                setIsLogin(true);
                setFormData({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    username: ''
                });
                setIsLoading(false);
            })
            .catch((error) => {
                const data = error.data.data as { [key: string]: { code: string, message: string } };
                Object.keys(data).forEach((key) => {
                    toast.error(`Error: ${key} - ${data[key].message || 'Unknown error'}`);
                });
                setIsLoading(false);
            });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <FloatingPanel
            isOpen={isOpen}
            onClose={onClose}
        >
            <h2 className="text-xl font-semibold text-zinc-100 mb-6">
                {isLogin ? 'Log In' : 'Create Account'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <button
                    type="button"
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-3 px-4 rounded transition-colors border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500/50 flex items-center justify-center gap-3"
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
                        <span className="bg-zinc-900 px-2 text-zinc-500">Or</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-2">
                            {isLogin ? "Username or Email" : "Username"}
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-800 text-zinc-100 px-3 py-2 rounded border border-zinc-700 focus:border-blue-500 focus:outline-none placeholder-zinc-500"
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
                                className="w-full bg-zinc-800 text-zinc-100 px-3 py-2 rounded border border-zinc-700 focus:border-blue-500 focus:outline-none placeholder-zinc-500"
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
                            className="w-full bg-zinc-800 text-zinc-100 px-3 py-2 rounded border border-zinc-700 focus:border-blue-500 focus:outline-none placeholder-zinc-500"
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
                                className="w-full bg-zinc-800 text-zinc-100 px-3 py-2 rounded border border-zinc-700 focus:border-blue-500 focus:outline-none placeholder-zinc-500"
                                placeholder="Confirm your password"
                            />
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-2 px-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Authenticating...' : (isLogin ? 'Log In' : 'Create Account')}
                </button>

                <div className="text-center space-y-3">
                    {isLogin && (
                        <a
                            href="#"
                            className="text-sm text-zinc-400 hover:text-blue-400 transition-colors"
                        >
                            Forgot your credentials?
                        </a>
                    )}
                    <div className="text-sm text-zinc-500">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                            {isLogin ? 'Create Account' : 'Sign In'}
                        </button>
                    </div>
                </div>
            </form>
        </FloatingPanel>
    );
}
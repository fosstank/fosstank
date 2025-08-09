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

import React, { useState, useCallback, useEffect } from 'react';
import Toast from './toast';

interface ToastData {
    id: string;
    variant: 'default' | 'info' | 'success' | 'warning' | 'error';
    title?: string;
    description?: string;
    duration?: number;
    isRemoving?: boolean;
    isVisible?: boolean;
}

// Global toast manager
class ToastManager {
    private listeners: Set<(toasts: ToastData[]) => void> = new Set();
    private toasts: ToastData[] = [];

    subscribe(listener: (toasts: ToastData[]) => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach(listener => listener([...this.toasts]));
    }

    addToast(toast: Omit<ToastData, 'id' | 'isRemoving' | 'isVisible'>) {
        const id = Math.random().toString(36).substring(7);
        const newToast = { ...toast, id, isRemoving: false, isVisible: false };

        this.toasts.push(newToast);
        this.notify();

        // Trigger slide-in animation after a brief delay
        setTimeout(() => {
            this.toasts = this.toasts.map(t =>
                t.id === id ? { ...t, isVisible: true } : t
            );
            this.notify();
        }, 50);

        // Auto remove after duration (default 5 seconds)
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(id);
            }, duration);
        }
    }

    removeToast(id: string) {
        // Mark toast as removing and trigger exit animation
        this.toasts = this.toasts.map(toast =>
            toast.id === id ? { ...toast, isRemoving: true } : toast
        );
        this.notify();

        // Actually remove after animation completes
        setTimeout(() => {
            this.toasts = this.toasts.filter(toast => toast.id !== id);
            this.notify();
        }, 300); // Match animation duration
    }

    info(message: string, title?: string, duration?: number) {
        this.addToast({ variant: 'info', description: message, title, duration });
    }

    success(message: string, title?: string, duration?: number) {
        this.addToast({ variant: 'success', description: message, title, duration });
    }

    warning(message: string, title?: string, duration?: number) {
        this.addToast({ variant: 'warning', description: message, title, duration });
    }

    error(message: string, title?: string, duration?: number) {
        this.addToast({ variant: 'error', description: message, title, duration });
    }
}

// Global instance
const toastManager = new ToastManager();

// Export the toast functions
export const toast = {
    info: (message: string, title?: string, duration?: number) => toastManager.info(message, title, duration),
    success: (message: string, title?: string, duration?: number) => toastManager.success(message, title, duration),
    warning: (message: string, title?: string, duration?: number) => toastManager.warning(message, title, duration),
    error: (message: string, title?: string, duration?: number) => toastManager.error(message, title, duration),
};

export default function Toaster() {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    useEffect(() => {
        toastManager.subscribe(setToasts);
    }, []);

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-xs w-full">
            {toasts.map((toastData) => (
                <div
                    key={toastData.id}
                    className={`transition-all duration-300 ease-in-out ${toastData.isRemoving
                        ? 'transform translate-x-full opacity-0'
                        : toastData.isVisible
                            ? 'transform translate-x-0 opacity-100'
                            : 'transform translate-x-full opacity-0'
                        }`}
                >
                    <Toast
                        variant={toastData.variant}
                        title={toastData.title}
                        description={toastData.description}
                        onClose={() => toastManager.removeToast(toastData.id)}
                        className="text-xs"
                    />
                </div>
            ))}
        </div>
    );
}
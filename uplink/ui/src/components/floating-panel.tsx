import { X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import Panel from "./panel";

interface FloatingPanelProps {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    isLoading?: boolean;
    loadingTitle?: string;
    loadingMessage?: string;
}

export default function FloatingPanel({
    children,
    isOpen,
    onClose,
    isLoading = false,
    loadingTitle = "Loading...",
    loadingMessage = "Please wait..."
}: FloatingPanelProps) {
    const [loadingProgress, setLoadingProgress] = useState(0);

    useEffect(() => {
        if (isLoading) {
            setLoadingProgress(0);
            const interval = setInterval(() => {
                setLoadingProgress(prev => {
                    if (prev >= 95) return prev;
                    const increment = Math.random() * 15 + 5; // Random increment between 5-20%
                    return Math.min(prev + increment, 95);
                });
            }, 200);

            return () => clearInterval(interval);
        } else {
            setLoadingProgress(100);
            const timeout = setTimeout(() => setLoadingProgress(0), 300);
            return () => clearTimeout(timeout);
        }
    }, [isLoading]);

    if (!isOpen) return null;
    return (
        <div onMouseDown={onClose} className="fixed inset-0 backdrop-blur-xs bg-opacity-20 flex items-center justify-center">
            <div onMouseDown={e => e.stopPropagation()} className="relative">
                <button
                    onClick={onClose}
                    className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 p-1 hover:cursor-pointer"
                    aria-label="Close"
                >
                    <X className="w-5 h-5"></X>
                </button>
                <Panel>
                    <Panel.Body className="bg-neutral-900 p-2">
                        {isLoading ? (
                            <div className="flex flex-col gap-2 items-center min-w-80">
                                <h2 className="text-lg font-semibold text-white">{loadingTitle}</h2>
                                <div className="w-full bg-neutral-700 rounded-full h-0.5 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-700 to-blue-400 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${loadingProgress}%` }}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                                    <p className="text-zinc-400 text-sm">{loadingMessage}</p>
                                    <span className="text-zinc-500 text-xs font-mono">
                                        {Math.round(loadingProgress)}%
                                    </span>
                                </div>
                            </div>
                        ) : (
                            children
                        )}
                    </Panel.Body>
                </Panel>
            </div>
        </div>
    );
}
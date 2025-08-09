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

import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastVariant = "default" | "info" | "success" | "warning" | "error";

const getVariantClasses = (variant: ToastVariant) => {
    const baseClasses = "relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded border-2 p-4 pr-6 shadow-xl backdrop-blur-sm transition-all font-mono";

    switch (variant) {
        case "info":
            return `${baseClasses} bg-blue-900/90 border-blue-400 text-blue-50 shadow-blue-400/40 before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-400/20 before:to-cyan-400/20 before:rounded [&>.icon]:text-blue-300 [&>.icon]:drop-shadow-[0_0_6px_rgba(96,165,250,0.8)]`;
        case "success":
            return `${baseClasses} bg-green-900/90 border-green-400 text-green-50 shadow-green-400/40 before:absolute before:inset-0 before:bg-gradient-to-r before:from-green-400/20 before:to-lime-400/20 before:rounded [&>.icon]:text-green-300 [&>.icon]:drop-shadow-[0_0_6px_rgba(74,222,128,0.8)]`;
        case "warning":
            return `${baseClasses} bg-yellow-900/90 border-yellow-400 text-yellow-50 shadow-yellow-400/40 before:absolute before:inset-0 before:bg-gradient-to-r before:from-yellow-400/20 before:to-orange-400/20 before:rounded [&>.icon]:text-yellow-300 [&>.icon]:drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]`;
        case "error":
            return `${baseClasses} bg-red-900/90 border-red-400 text-red-50 shadow-red-400/40 before:absolute before:inset-0 before:bg-gradient-to-r before:from-red-400/20 before:to-pink-400/20 before:rounded [&>.icon]:text-red-300 [&>.icon]:drop-shadow-[0_0_6px_rgba(248,113,113,0.8)]`;
        default:
            return `${baseClasses} bg-gray-800/90 border-gray-500 text-gray-100 shadow-gray-500/30 before:absolute before:inset-0 before:bg-gradient-to-r before:from-gray-600/20 before:to-gray-700/20 before:rounded [&>.icon]:text-gray-400`;
    }
};

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ToastVariant;
    title?: string;
    description?: string;
    onClose?: () => void;
    showCloseButton?: boolean;
}

function getVariantIcon(variant: ToastProps["variant"]) {
    switch (variant) {
        case "success":
            return CheckCircle;
        case "error":
            return AlertCircle;
        case "warning":
            return AlertTriangle;
        case "info":
            return Info;
        default:
            return Info;
    }
}

export default function Toast({
    className,
    variant = "default",
    title,
    description,
    onClose,
    showCloseButton = true,
    children,
    ...props
}: ToastProps) {
    const IconComponent = getVariantIcon(variant);

    return (
        <div
            className={cn(getVariantClasses(variant), className)}
            {...props}
        >
            <div className="relative flex items-start space-x-3 flex-1">
                <IconComponent className="icon h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                    {title && (
                        <div className="text-sm font-semibold uppercase tracking-wider">
                            {title}
                        </div>
                    )}
                    {description && (
                        <div className="text-sm opacity-90">
                            {description}
                        </div>
                    )}
                    {children}
                </div>
            </div>
            {showCloseButton && onClose && (
                <button
                    onClick={onClose}
                    className="relative flex-shrink-0 rounded-sm p-1 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
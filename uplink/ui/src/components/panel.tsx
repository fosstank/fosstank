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

interface PanelProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    className?: string;
}

interface FooterProps {
    children: React.ReactNode;
    className?: string;
}

function Footer({ children, className = '' }: FooterProps) {
    return (
        <div className={`${className} bg-zinc-800 border-t border-neutral-600`}>
            {children}
        </div>
    );
}

export default function Panel({ children, title, subtitle, className = '' }: PanelProps) {
    return (
        <div className={`${className} flex flex-col border border-neutral-600 rounded-sm overflow-clip shadow-[4px_4px_0px_rgb(0_0_0/0.5)]`}>
            {/* Header */}
            <div className="flex items-center gap-1 bg-blue-900 px-1 border-b border-inherit">
                {title && (
                    <span className="font-semibold text-base">
                        {title}
                    </span>
                )}
                {subtitle && (
                    <span className="text-yellow-300 font-extralight text-sm">
                        {subtitle}
                    </span>
                )}
            </div>
            {/* Content */}
            <div className="flex-1 flex flex-col">
                {children}
            </div>
        </div>
    );
}

Panel.Footer = Footer;
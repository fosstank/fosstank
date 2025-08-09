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
    className?: string;
}

export default function Panel({ children, title, className = '' }: PanelProps) {
    return (
        <div className={`bg-zinc-950/80 border border-zinc-800/50 shadow-inner shadow-black p-4 ${className}`}>
            {title && (
                <h2 className="text-cyan-500 font-bold mb-4 uppercase tracking-wider [text-shadow:0_0_10px_theme(colors.cyan.500/40)]">
                    {title}
                </h2>
            )}
            {children}
        </div>
    );
}

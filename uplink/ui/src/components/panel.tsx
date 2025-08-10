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

export default function Panel({ children, title, subtitle, className = '' }: PanelProps) {
    return (
        <div className={`${className} border border-neutral-600 rounded-sm overflow-clip shadow-[4px_4px_0px_rgb(0_0_0/0.5)]`}>
            <div className="flex items-center gap-1 bg-blue-900 text-white px-1 border-b border-inherit">
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
            {children}
        </div>
    );
}
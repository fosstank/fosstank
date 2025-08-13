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

import React from "react";

type Color = 'blue' | 'red' | 'green' | 'yellow' | 'gray';
const ColorMap: Record<Color, string> = {
    blue: 'bg-blue-900',
    red: 'bg-red-900',
    green: 'bg-green-900',
    yellow: 'bg-yellow-900',
    gray: 'bg-neutral-900',
};

function Title({ text, className }: { text: string, className?: string }) {
    return (
        <span className={`${className} font-semibold text-base`}>
            {text}
        </span>
    )
}

function Subtitle({ text, className }: { text: string, className?: string }) {
    return (
        <span className={`${className} text-yellow-300 font-extralight text-sm`}>
            {text}
        </span>
    )
}

function Header({ className, children, color = 'blue' }: { className?: string, children: React.ReactNode; color?: Color }) {
    return (
        <div className={`${className} flex items-center gap-1 ${ColorMap[color]} border-b border-inherit`}>
            {children}
        </div>
    );
}

Header.Title = Title;
Header.Subtitle = Subtitle;

function Body({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex-1 flex flex-col">
            {children}
        </div>
    );
}

interface FooterProps {
    children: React.ReactNode;
    className?: string;
}

function Footer({ children, className = '' }: FooterProps) {
    return (
        <div className={`${className} bg-neutral-900 border-t border-neutral-600`}>
            {children}
        </div>
    );
}

interface PanelProps {
    children: React.ReactNode;
    className?: string;
}
export default function Panel({ children, className = '' }: PanelProps) {
    return (
        <div className={`${className} flex flex-col border border-neutral-600 rounded-sm overflow-clip shadow-[4px_4px_0px_rgb(0_0_0/0.5)]`}>
            {children}
        </div >
    );
}

Panel.Header = Header;
Panel.Body = Body;
Panel.Footer = Footer;
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

type Color = 'purple' | 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'pink' | 'cyan';

interface MessagePanelProps {
    title?: string;
    content?: string;
    borderLeft?: boolean;
    clickable?: boolean;
    color?: Color;
}

const COLOR_CLASSES: { [key in Color]: { text: string, border: string, hover: string } } = {
    purple: {
        text: 'text-purple-500/90',
        border: 'border-purple-500/50',
        hover: 'hover:border-purple-500/50'
    },
    blue: {
        text: 'text-blue-500/90',
        border: 'border-blue-500/50',
        hover: 'hover:border-blue-500/50'
    },
    green: {
        text: 'text-green-500/90',
        border: 'border-green-500/50',
        hover: 'hover:border-green-500/50'
    },
    red: {
        text: 'text-red-500/90',
        border: 'border-red-500/50',
        hover: 'hover:border-red-500/50'
    },
    yellow: {
        text: 'text-yellow-500/90',
        border: 'border-yellow-500/50',
        hover: 'hover:border-yellow-500/50'
    },
    orange: {
        text: 'text-orange-500/90',
        border: 'border-orange-500/50',
        hover: 'hover:border-orange-500/50'
    },
    pink: {
        text: 'text-pink-500/90',
        border: 'border-pink-500/50',
        hover: 'hover:border-pink-500/50'
    },
    cyan: {
        text: 'text-cyan-500/90',
        border: 'border-cyan-500/50',
        hover: 'hover:border-cyan-500/50'
    }
};

export default function InfoPanel({ title, content, clickable, borderLeft = false, color = 'purple' }: MessagePanelProps) {
    const borderLeftClass = borderLeft ? 'border-l-2' : '';
    const colorClass = COLOR_CLASSES[color];
    const clickableClass = clickable ? `${colorClass.hover} transition-colors cursor-pointer border border-zinc-800` : '';

    return (
        <div className={`bg-zinc-900 p-3 text-zinc-300 text-sm ${borderLeftClass} ${colorClass.border} ${clickableClass}`}>
            {title && (
                <div className={`${colorClass.text} text-xs mb-1`}>{title}</div>
            )}
            {content && (
                <p>{content}</p>
            )}
        </div>
    );
}
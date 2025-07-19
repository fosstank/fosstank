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
    var borderLeftClass = borderLeft ? 'border-l-2' : '';
    var colorClass = COLOR_CLASSES[color];
    var clickableClass = clickable ? `${colorClass.hover} transition-colors cursor-pointer border border-zinc-800` : '';

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
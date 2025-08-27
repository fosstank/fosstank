import React from 'react';

interface PollButtonProps {
    title: string;
    votes: number;
    progress: number; // 0-100
    onMouseDown?: () => void;
    disabled?: boolean;
    selected?: boolean;
    className?: string;
}

const PollButton: React.FC<PollButtonProps> = ({
    title,
    votes,
    progress,
    onMouseDown,
    disabled = false,
    selected = false,
    className = '',
}) => {
    const clampedProgress = Math.max(0, Math.min(100, progress));

    return (
        <button
            onMouseDown={onMouseDown}
            disabled={disabled}
            className={`${className} relative overflow-hidden rounded-xs bg-neutral-800 border ${!disabled && selected ? "hover:border-cyan-200" : "hover:border-neutral-300"} ${selected ? 'border-cyan-400 font-bold' : 'border-neutral-600'}`}
        >
            {/* Progress bar background */}
            <div
                className={`absolute top-0 left-0 h-full bg-red-800 transition-all duration-500 ease-out`}
                style={{
                    width: `${clampedProgress}%`,
                }}
            />

            {/* Button text */}
            <div className={`relative w-full h-full flex ${selected ? disabled ? 'text-cyan-500 font-bold' : 'text-blue-400' : ''}`}>
                <span className='text-left pl-1'>{title}</span>
                <span className='flex-1'></span>
                <span className="ml-1 ">({votes.toLocaleString()})</span>
            </div>
        </button>
    );
};

export default PollButton;
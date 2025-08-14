import React from 'react';

interface PollButtonProps {
    children: React.ReactNode;
    progress: number; // 0-100
    onClick?: () => void;
    disabled?: boolean; // TODO: Implement disabled state
    className?: string;
}

const PollButton: React.FC<PollButtonProps> = ({
    children,
    progress,
    onClick,
    disabled = false,
    className = '',
}) => {
    const clampedProgress = Math.max(0, Math.min(100, progress));

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${className} relative overflow-hidden rounded-xs border-neutral-600 hover:border-neutral-300 border bg-neutral-800`}
        >
            {/* Progress bar background */}
            <div
                className={`absolute top-0 left-0 h-full bg-linear-to-t from-red-950 via-red-950 via-10% to-red-500`}
                style={{
                    width: `${clampedProgress}%`,
                }}
            />

            {/* Button text */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </button>
    );
};

export default PollButton;
'use client';

import React from 'react';

interface LEDScrollerProps {
    text: string;
    duration?: number; // Duration in seconds for one complete scroll
    className?: string;
}

const LEDScroller: React.FC<LEDScrollerProps> = ({
    text,
    duration = 8,
    className = ''
}) => {
    return (
        <div className={`overflow-hidden rounded-xs bg-black text-green-400 py-2 ${className}`}>
            <div
                className="whitespace-nowrap w-max"
                style={{
                    animation: `scroll ${duration}s steps(30) infinite`,
                    willChange: 'transform'
                }}
            >
                {text}
            </div>
            <style jsx>
                {`
                    @keyframes scroll {
                        0% {
                            transform: translateX(100%);
                        }
                        100% {
                            transform: translateX(-100%);
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default LEDScroller;
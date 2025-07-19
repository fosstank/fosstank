'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface HLSPlayerProps {
    src: string;
    className?: string;
    autoPlay?: boolean;
    controls?: boolean;
}

export default function HLSPlayer({ src, className, autoPlay = false, controls = true }: HLSPlayerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerClassName = `relative overflow-hidden border-2 border-zinc-700/50 shadow-inner shadow-black/50 ${className || ''}`;

    useEffect(() => {
        if (!videoRef.current) return;

        if (Hls.isSupported()) {
            const hls = new Hls({
                manifestLoadingMaxRetry: 3
            });
            hls.loadSource(src);
            hls.attachMedia(videoRef.current);

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS error:', data);
            });

            return () => {
                hls.destroy();
            };
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
            // For Safari (which supports HLS natively)
            videoRef.current.src = src;
        }
    }, [src]);

    return (
        <div className={containerClassName}>
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay={autoPlay}
                controls={controls}
            />
        </div>
    );
}

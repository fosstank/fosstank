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
        <video
            ref={videoRef}
            className={className}
            autoPlay={autoPlay}
            controls={controls}
        />
    );
}

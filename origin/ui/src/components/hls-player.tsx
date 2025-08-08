'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface HLSPlayerProps {
    src: string;
    autoPlay?: boolean;
    controls?: boolean;
}

export default function HLSPlayer({ src, autoPlay = false, controls = true }: HLSPlayerProps) {
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
        <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 group-hover:from-cyan-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
            <div className="transform transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                <div className="relative">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/25 to-purple-500/25 rounded-sm blur-[2px]"></div>
                    <div className="aspect-video relative overflow-hidden border-2 border-zinc-700/50 shadow-inner shadow-black/50">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            autoPlay={autoPlay}
                            controls={controls}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

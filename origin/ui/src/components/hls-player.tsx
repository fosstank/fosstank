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

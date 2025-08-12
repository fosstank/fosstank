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
    title: string;
    subtitle: string;
    autoPlay?: boolean;
    controls?: boolean;
}

export default function HLSPlayer({ src, autoPlay = false, controls = true, title, subtitle }: HLSPlayerProps) {
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
        <div className="relative">
            <video
                ref={videoRef}
                className="relative w-full h-full border border-neutral-600 rounded bg-neutral-600 shadow-[4px_4px_0px_rgb(0_0_0/0.5)]"
                autoPlay={autoPlay}
                controls={controls}
            />
            <div className="absolute top-0 left-0 w-full flex px-1">
                <span className="text-yellow-200 uppercase">{title.replaceAll(" ", "_")}</span>
                <div className="flex-1"></div>
                <span>{subtitle}</span>
            </div>
        </div>
    );
}

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
import Panel from './panel';
import { ArrowLeft, ArrowRight, SquareX } from 'lucide-react';

interface HLSPlayerProps {
    src: string;
    title: string;
    subtitle: string;
    autoPlay?: boolean;
    controls?: boolean;
    onLeft?: () => void;
    onRight?: () => void;
    onClose?: () => void;
}

export default function HLSPlayer({ src, autoPlay = false, controls = true, title, subtitle, onLeft, onRight, onClose }: HLSPlayerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (!videoRef.current) return;
        if (src === "") return;

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
        <Panel className="h-full border border-neutral-600 rounded">
            <Panel.Header color="gray" className="p-1">
                <button
                    onClick={onLeft}
                    className="text-muted-foreground hover:text-white"
                >
                    <ArrowLeft />
                </button>
                <button
                    onClick={onRight}
                    className="text-muted-foreground hover:text-white"
                >
                    <ArrowRight />
                </button>
                <Panel.Header.Title text={title} className="pl-4" />
                <Panel.Header.Subtitle text={subtitle} className="pl-4" />
                <div className="flex-1"></div>
                <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-white"
                >
                    <SquareX />
                </button>
            </Panel.Header>
            <Panel.Body>
                <video
                    ref={videoRef}
                    className="w-full h-full"
                    autoPlay={autoPlay}
                    controls={controls}
                />
            </Panel.Body>
        </Panel>
    );
}

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

import { Stream } from '@/lib/pocketbase';
import { STATIC_ASSETS } from '@/lib/static-assets';
import Image from 'next/image';
import { useRef } from 'react';

interface StreamPreviewProps {
    title: string;
    subtitle: string;
    stream: Stream;
    offline?: boolean;
    onClick?: () => void;
}

export default function StreamPreview({ title, subtitle, stream, offline = false, onClick }: StreamPreviewProps) {
    const imgElement = useRef<HTMLImageElement | null>(null);

    return (
        <button
            className={`${offline ? "brightness-50 saturate-0" : ""} cursor-pointer relative border-2 border-green-400 rounded-none overflow-clip shadow-[2px_2px_0px_rgb(0_0_0/1)] hover:shadow-[4px_4px_0px_rgb(0_0_0/1)] transition-all duration-100 bg-gray-900 hover:bg-gray-800`}
            onClick={onClick}
            onMouseEnter={() => {
                // TODO: Play Sound Effect
                if (imgElement.current) {
                    imgElement.current.src = STATIC_ASSETS["noiseColor"];
                    setTimeout(() => {
                        if (imgElement.current) {
                            imgElement.current.src = STATIC_ASSETS["noise"];
                        }
                    }, 250);
                }
            }}
        >
            <Image
                ref={imgElement}
                src={STATIC_ASSETS["noise"]}
                alt="noise"
                fill={true}
                className="object-cover bg-black hover:brightness-110 hover:contrast-125"
                unoptimized
            />
            <div className="absolute top-0 left-0 w-full flex px-2 py-1 bg-black border-b border-green-400">
                <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${offline ? 'bg-red-500 animate-pulse' : 'bg-green-400'}`}></div>
                    <span className="text-green-400 uppercase font-mono text-xs tracking-wider">CAM_{title.replaceAll(" ", "_").toUpperCase()}</span>
                </div>
                <div className="flex-1"></div>
                <span className={`uppercase font-mono text-xs tracking-wider ${offline ? 'text-red-400 animate-pulse' : 'text-amber-300'}`}>
                    {offline ? "SYSTEM_ERROR" : `SEC_LVL_${subtitle.toUpperCase()}`}
                </span>
            </div>
        </button>
    );
}

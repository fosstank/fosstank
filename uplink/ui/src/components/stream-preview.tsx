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
            className={`${offline ? "brightness-50" : ""} cursor-pointer relative border border-neutral-600 rounded overflow-clip shadow-[4px_4px_0px_rgb(0_0_0/0.5)]`}
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
                className="object-cover bg-neutral-600 hover:brightness-110"
                unoptimized
            />
            <div className="absolute top-0 left-0 w-full flex px-1">
                <span className="text-yellow-200 uppercase">{title.replaceAll(" ", "_")}</span>
                <div className="flex-1"></div>
                <span className="uppercase">{offline ? "OFFLINE" : subtitle}</span>
            </div>
        </button>
    );
}

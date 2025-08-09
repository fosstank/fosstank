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

interface ChatMessageProps {
    id: number;
    text: string;
    timestamp: string;
    user: {
        name: string;
        avatar: string;
    };
    cameraName?: string;
}

export default function ChatMessage({ text, timestamp, user, cameraName }: ChatMessageProps) {
    return (
        <div className="relative group">
            <div className="relative bg-zinc-900 p-3 text-sm">
                <div className="flex items-start gap-3">
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 border-2 border-accent-foreground bg-zinc-800"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-medium text-muted-foreground">{user.name}</span>
                            <span className="font-mono text-xs text-muted-foreground">{timestamp}</span>
                        </div>
                        <p className="text-muted-foreground break-words">{text}</p>
                        {cameraName && (
                            <div className="mt-2 text-xs text-muted-foreground font-mono">
                                Viewing: {cameraName}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
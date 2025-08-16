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
    content: string;
    created: string;
    username: string;
    avatar: string;
    stream?: string;
}

export default function ChatMessage({ content, created, username, avatar, stream }: ChatMessageProps) {
    return (
        <div className="flex flex-col p-2">
            <div className="flex gap-1">
                <img
                    src={avatar || "/avatar.jpg"}
                    alt="Profile Picture"
                    className="w-8 h-8 border border-neutral-600"
                />
                <div className="flex-1 text-sm/3.5">
                    <span className="font-medium text-yellow-200 pr-1">{username}</span>
                    <span className="text-neutral-300 break-word">{content}</span>
                </div>
            </div>
            <div className="flex justify-end text-xs font-thin -tracking-[1.5px]">
                {stream && (
                    <span className="text-white pr-1 uppercase">{stream} @</span>
                )}
                {/* TODO: Format timestamp correctly. Should look like: 8/10/25, 9:00 PM */}
                <span className="text-muted-foreground">{created}</span>
            </div>
        </div>
    );
}
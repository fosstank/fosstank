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

import PocketBase, { RecordModel, RecordService } from 'pocketbase';

export interface User extends RecordModel {
    username: string;
    balance: number;
}

export interface Stream {
    id: string
    title: string
    url: string
}

export interface Message {
    id: string
    user: string
    stream: string
    content: string
    created: string
    updated: string
    expand: {
        user: User
    }
}

export interface TTSOption {
    id: string;
    title: string;
    cost: number;
}

export interface TTSOrder {
    id: string;
    user: string;
    option: string;
    message: string;
}

export interface SFXOption {
    id: string;
    title: string;
    cost: number;
}

export interface SFXOrder {
    id: string;
    user: string;
    option: string;
}

export interface FosstoyOption {
    id: string;
    title: string;
    description: string;
    cost: number;
    participant_count: number;
    message_required: boolean;
}

export interface FosstoyOrder {
    id: string;
    user: string;
    option: string;
    participants: string[];
    message: string;
}

export interface Participant {
    id: string;
    name: string;
    nickname: string;
    image: string;
    seasons: string[];
}

export interface Season {
    id: string;
    title: string;
}

export interface Announcement {
    id: string;
    title: string;
    message: string;
    published: boolean;
    created: string;
    updated: string;
}

interface TypedPocketBase extends PocketBase {
    collection(idOrName: string): RecordService // default fallback for any other collection
    collection(idOrName: 'streams'): RecordService<Stream>
    collection(idOrName: 'users'): RecordService<User>
    collection(idOrName: 'messages'): RecordService<Message>
    collection(idOrName: 'tts_options'): RecordService<TTSOption>
    collection(idOrName: 'tts_orders'): RecordService<TTSOrder>
    collection(idOrName: 'sfx_options'): RecordService<SFXOption>
    collection(idOrName: 'sfx_orders'): RecordService<SFXOrder>
    collection(idOrName: 'fosstoy_options'): RecordService<FosstoyOption>
    collection(idOrName: 'fosstoy_orders'): RecordService<FosstoyOrder>
    collection(idOrName: 'participants'): RecordService<Participant>
    collection(idOrName: 'seasons'): RecordService<Season>
    collection(idOrName: 'announcements'): RecordService<Announcement>
}

export const pb = new PocketBase('http://127.0.0.1:8091') as TypedPocketBase;
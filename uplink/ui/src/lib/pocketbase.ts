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

interface TypedPocketBase extends PocketBase {
    collection(idOrName: string): RecordService // default fallback for any other collection
    collection(idOrName: 'streams'): RecordService<Stream>
    collection(idOrName: 'users'): RecordService<User>
    collection(idOrName: 'messages'): RecordService<Message>
    collection(idOrName: 'tts_options'): RecordService<TTSOption>
    collection(idOrName: 'tts_orders'): RecordService<TTSOrder>
    collection(idOrName: 'sfx_options'): RecordService<SFXOption>
    collection(idOrName: 'sfx_orders'): RecordService<SFXOrder>
}

export const pb = new PocketBase('http://127.0.0.1:8091') as TypedPocketBase;
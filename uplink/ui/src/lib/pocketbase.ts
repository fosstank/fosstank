import PocketBase, { RecordModel, RecordService } from 'pocketbase';

export interface User extends RecordModel {
    username: string;
}

export interface Stream {
    id: string
    name: string
}

interface TypedPocketBase extends PocketBase {
    collection(idOrName: string): RecordService // default fallback for any other collection
    collection(idOrName: 'streams'): RecordService<Stream>
    collection(idOrName: 'users'): RecordService<User>
}

export const pb = new PocketBase('http://127.0.0.1:8090') as TypedPocketBase;
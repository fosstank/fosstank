import PocketBase, { RecordService } from 'pocketbase';

export interface Stream {
    id: string
    name: string
}

export interface TypedPocketBase extends PocketBase {
    collection(idOrName: string): RecordService // default fallback for any other collection
    collection(idOrName: 'streams'): RecordService<Stream>
}
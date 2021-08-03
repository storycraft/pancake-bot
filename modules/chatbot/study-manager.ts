/*
 * Created on Mon Apr 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as Crypto from 'crypto';
import { LowdbAsync } from 'lowdb';
import { Channel, Chat, KnownChatType } from 'node-kakao';
import { DatabaseEntry } from './database';

export class StudyManager {
    
    constructor(private dbEntry: DatabaseEntry) {

    }

    canStudy(chat: Chat) {
        return chat.text && chat.type === KnownChatType.TEXT;
    }

    async canResponse(channel: Channel) {
        return this.getChannelResponseFlag(channel);
    }

    async getTotalMessage(): Promise<number> {
        if (!(await this.dbEntry.has('total'))) return 0;
        
        return (await this.dbEntry.get('total')) as number;
    }

    async setTotalMessage(count: number): Promise<void> {
        await this.dbEntry.set('total', count);
    }

    async getKeyEntry(): Promise<DatabaseEntry> {
        return this.dbEntry.getEntry('keys');
    }

    async getSettingsEntry(): Promise<DatabaseEntry> {
        return this.dbEntry.getEntry('settings');
    }

    async getChannelResponseFlag(channel: Channel): Promise<boolean> {
        let entry = await this.getSettingsEntry();

        if (!await (entry.has(channel.channelId.toString()))) return false;

        return (await entry.get(channel.channelId.toString())) as boolean;
    }

    async setChannelResponseFlag(channel: Channel, flag: boolean): Promise<boolean> {
        let entry = await this.getSettingsEntry();

        return entry.set(channel.channelId.toString(), flag);
    }

    transformTextToKey(text: string): string {
        let hash = Crypto.createHash('md5');
        hash.update(text);
        return hash.digest('hex');
    }

    async getChatKey(text: string): Promise<ChatKey | null> {
        return this.getChatKeyByHash(this.transformTextToKey(text));
    }

    async getChatKeyByHash(hash: string): Promise<ChatKey | null> {
        let keyEntry = await this.getKeyEntry();

        if (!(await keyEntry.has(hash))) return null;

        return (await keyEntry.get(hash)) as ChatKey;
    }

    async setChatKey(chatKey: ChatKey): Promise<void> {
        let keyEntry = await this.getKeyEntry();

        await keyEntry.set(this.transformTextToKey(chatKey.text), chatKey);
    }

    async getChatKeyHashConnectionRefCount(hash: string, connectionHash: string): Promise<number> {
        let keyEntry = await this.getKeyEntry();

        if (!(await keyEntry.has(hash))) return 0;

        let chatKeyEntry = await keyEntry.getEntry(hash);

        if (!chatKeyEntry) return 0;

        let connectionEntry = await chatKeyEntry.getEntry('connection');

        if (!connectionEntry) return 0;

        return (await connectionEntry.get(connectionHash)) as number;
    }

    async updateChatKeyConnectionRefCount(text: string, connectionHash: string, refCount: number): Promise<boolean> {
        return this.updateChatKeyHashConnectionRefCount(this.transformTextToKey(text), connectionHash, refCount);
    }

    async updateChatKeyHashConnectionRefCount(hash: string, connectionHash: string, refCount: number): Promise<boolean> {
        let keyEntry = await this.getKeyEntry();

        if (!(await keyEntry.has(hash))) return false;

        let chatKeyEntry = await keyEntry.getEntry(hash);
        let connectionEntry = await chatKeyEntry.getEntry('connection');

        return connectionEntry.set(connectionHash, refCount);
    }

    createNewChatKey(text: string): ChatKey {
        return {
            'text': text,
            'connection': {}
        }
    }
}

export type DBSchema = {
    total: number,
    keys: Record<string, ChatKey>,
    settings: ChatSettings
}

export type ChatSettings = {
    [key: string]: boolean
};

export type ChatConnection = {
    [key: string]: number
};

export type ChatKey = {
    text: string,
    connection: ChatConnection
};
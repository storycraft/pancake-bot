/*
 * Created on Mon Apr 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as Crypto from 'crypto';
import { LowdbAsync } from 'lowdb';
import { Channel, Chat, KnownChatType } from 'node-kakao';

export class StudyManager {
    
    constructor(private dbEntry: LowdbAsync<DBSchema>) {

    }

    async canStudy(chat: Chat) {
        return chat.text && chat.type === KnownChatType.TEXT;
    }

    async canResponse(channel: Channel) {
        return this.getChannelResponseFlag(channel);
    }

    getTotalMessage() {
        return this.dbEntry.get('total').defaultTo(0).value();
    }

    async setTotalMessage(count: number): Promise<void> {
        await this.dbEntry.set('total', count).write();
    }

    getKeyEntry() {
        return this.dbEntry.get('keys').defaultTo({});
    }

    getSettingsEntry() {
        return this.dbEntry.get('settings');
    }

    async getChannelResponseFlag(channel: Channel): Promise<boolean> {
        let entry = this.getSettingsEntry();

        if (!entry.get(channel.channelId.toString()).value()) return false;

        return true;
    }

    async setChannelResponseFlag(channel: Channel, flag: boolean) {
        let entry = this.getSettingsEntry();

        await entry.set(channel.channelId.toString(), flag).write();
    }

    transformTextToKey(text: string): string {
        let hash = Crypto.createHash('md5');
        hash.update(text);
        return hash.digest('hex');
    }

    getChatKey(text: string): ChatKey | null {
        return this.getChatKeyByHash(this.transformTextToKey(text));
    }

    getChatKeyByHash(hash: string): ChatKey | null {
        let keyEntry = this.getKeyEntry();

        return keyEntry.get(hash).defaultTo(null).value();
    }

    async setChatKey(chatKey: ChatKey): Promise<void> {
        let keyEntry = this.getKeyEntry();

        await keyEntry.set(this.transformTextToKey(chatKey.text), chatKey).write();
    }

    getChatKeyHashConnectionRefCount(hash: string, connectionHash: string): number {
        let keyEntry = this.getKeyEntry();

        if (!keyEntry.has(hash).value()) return 0;

        let chatKeyEntry = keyEntry.get(hash);

        let connectionEntry = chatKeyEntry.get('connection');

        if (!connectionEntry.has(connectionHash).value()) return 0;

        return connectionEntry.get(connectionHash).value();
    }

    async updateChatKeyConnectionRefCount(text: string, connectionHash: string, refCount: number): Promise<boolean> {
        return this.updateChatKeyHashConnectionRefCount(this.transformTextToKey(text), connectionHash, refCount);
    }

    async updateChatKeyHashConnectionRefCount(hash: string, connectionHash: string, refCount: number): Promise<boolean> {
        let keyEntry = this.getKeyEntry();

        if (!keyEntry.has(hash).value()) return false;

        let chatKeyEntry = keyEntry.get(hash);
        let connectionEntry = chatKeyEntry.get('connection');

        await connectionEntry.set(connectionHash, refCount).write();

        return true;
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
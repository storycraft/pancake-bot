/*
 * Created on Tue Aug 03 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { BotModule, ModuleDescriptor, TalkContext } from "../../api/bot";
import { ChatCmdListener } from "../../api/command";
import { LowdbAsync } from "lowdb"
import { join } from "path";
import * as fs from "fs";
import { promisify } from "util";
import { DBSchema, StudyManager } from "./study-manager";
import { Channel, Chat, KnownChatType, TalkChannel, TalkChatData } from "node-kakao";
import * as crypto from "crypto";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'chatbot',
    name: 'chatbot',

    desc: '아무말 대잔치'

}

const SORRY_FOR_THE_INCONVENIENCE = join(__dirname, 'resources', 'forbidden.png');

export default async function moduleInit(mod: BotModule, options: { database: LowdbAsync<DBSchema> }) {
    const urlRegex = /(http(s)?:\/\/?\/?[^\s]+)/g;
    const sorryForTheInconvenienceImg = await promisify(fs.readFile)(SORRY_FOR_THE_INCONVENIENCE, { encoding: null });

    const lastMessageMap: WeakMap<Channel, TalkChatData> = new WeakMap();
    const notifyMap: WeakMap<Channel, boolean> = new WeakMap();

    const studyManager = new StudyManager(options.database);

    mod.commandHandler.any.addListener(new ChatCmdListener(
        ['chat-toggle'],
        {
            description: '봇 응답 설정 토글',
            usage: 'chat-toggle'
        },
        async (info, ctx) => {
            let newFlag = !studyManager.getChannelResponseFlag(ctx.channel);

            await studyManager.setChannelResponseFlag(ctx.channel, newFlag);

            await ctx.channel.sendChat(`응답 설정이 ${newFlag} 로 설정되었습니다`);
        }
    ));

    mod.commandHandler.any.addListener(new ChatCmdListener(
        ['chatbot-info'],
        {
            description: '헛소리 학습 정보',
            usage: 'chatbot-info'
        },
        (info, ctx) => {
            ctx.channel.sendChat(`전체 학습한 채팅량: ${studyManager.getTotalMessage()} (개)`).then();
        }
    ));

    mod.commandHandler.any.addListener(new ChatCmdListener(
        ['keyword'],
        {
            description: '헛소리 학습 정보',
            usage: 'keyword [키워드]'
        },
        async (info, ctx) => {
            if (info.args.length < 1) {
                await ctx.channel.sendChat('키워드가 제공되지 않았습니다');
                return;
            }

            let chatkey = studyManager.getChatKey(info.args);

            if (!chatkey) {
                await ctx.channel.sendChat(`${info.args} 는 학습되지 않았습니다`);
                return;
            }

            let str = `${info.args} 의 학습정보\n\n`;

            let connection = chatkey.connection;

            let keyTotal = 0;

            for (let key in connection) {
                keyTotal += (connection[key] || 0);
            }

            let ratio = (keyTotal / studyManager.getTotalMessage()) * 100;
            let percent = Math.max(Math.min((Object.keys(connection).length / keyTotal) * Math.min(Object.keys(connection).length / 3, 1) * 0.72, 0.7), 0.17) * 100;

            str += `\n\n전체 중 비율 ${ratio.toFixed(2)} %\n\n응답률: ${percent.toFixed(2)} %`;

            await ctx.channel.sendChat(str);
        }
    ));

    mod.addListener('chat', async (ctx) => {
        await processGossip(ctx);
    });

    async function processGossip(ctx: TalkContext<TalkChannel>, multiplier: number = 1) {
        if (!studyManager.canStudy(ctx.data.chat)) return;

        let text = ctx.data.text.trim();
        let lastMessage = lastMessageMap.get(ctx.channel);
        lastMessageMap.set(ctx.channel, ctx.data);

        if (!lastMessage) return;

        let total = studyManager.getTotalMessage();
        await studyManager.setTotalMessage(total + 1);

        let lastText = lastMessage.text.trim();

        let textHash = studyManager.transformTextToKey(text);
        let lastTextHash = studyManager.transformTextToKey(lastText);

        let random: number = crypto.randomBytes(2).readUInt16LE(0); // 0 - 65535

        let lastChatKey = studyManager.getChatKeyByHash(lastTextHash);

        if (!lastChatKey) {
            await studyManager.setChatKey(studyManager.createNewChatKey(lastText));
        }

        if (lastText !== text || Math.random() < 0.1) {
            let newLastChatRefCount: number = studyManager.getChatKeyHashConnectionRefCount(lastTextHash, textHash) + 1;
            await studyManager.updateChatKeyHashConnectionRefCount(lastTextHash, textHash, newLastChatRefCount);
        }



        let chatKey = studyManager.getChatKeyByHash(textHash);
        if (!chatKey) {
            let wordList = text.split(' ');

            if (wordList.length < 2) return;

            chatKey = studyManager.getChatKey(wordList[Math.floor(wordList.length / 2)]);
        }

        if (!chatKey) return;

        let connectionKeys = Object.keys(chatKey.connection);
        if (connectionKeys.length < 1) return;

        if (random < 10240) { // LEARN SOMETHING FROM AFTER TREE
            let targetKey = connectionKeys[Math.min(Math.floor(connectionKeys.length * Math.random()), connectionKeys.length - 1)];
            let targetChatKey = studyManager.getChatKeyByHash(targetKey);

            if (!targetChatKey) return;

            let targetKeyConnectionKeys = Object.keys(targetChatKey.connection);
            let studyKey = targetKeyConnectionKeys[Math.min(Math.floor(targetKeyConnectionKeys.length * Math.random()), targetKeyConnectionKeys.length - 1)];

            let newStudyKeyRefCount = studyManager.getChatKeyHashConnectionRefCount(textHash, studyKey) + 1;
            await studyManager.updateChatKeyHashConnectionRefCount(textHash, studyKey, newStudyKeyRefCount);
        }

        if (!studyManager.getChannelResponseFlag(ctx.channel)) return;

        let totalKeyRefCount = 0;

        for (let connectionKey of connectionKeys) {
            totalKeyRefCount += chatKey.connection[connectionKey] || 0;
        }

        let offset = ctx.data.sendAt.getTime() - lastMessage.sendAt.getTime();

        let ratio = Math.max(Math.min((connectionKeys.length / totalKeyRefCount) * Math.min(connectionKeys.length / 3, 1) * 0.72 * multiplier * (offset / 2800), 0.7), 0.17);

        if (Math.random() >= ratio) return;

        let targetArea = Math.floor((random / 65535) * totalKeyRefCount);

        let targetKey: string = '';

        let i = 0;
        let weight = 0;
        for (let connectionKey of connectionKeys) {
            weight = chatKey.connection[connectionKey] || 0;

            if (targetArea >= i && targetArea < i + weight) {
                targetKey = connectionKey;
                break;
            }

            i += weight;
        }

        if (targetKey === '') return;

        let targetChatKey = studyManager.getChatKeyByHash(targetKey);

        if (!targetChatKey) return;

        let nonSensitiveText = targetChatKey.text.replace(urlRegex, ' [삐] ').trim();

        if (targetChatKey.text !== nonSensitiveText && !notifyMap.has(ctx.channel)) {
            await Promise.all([
                ctx.channel.sendChat('* 민감한 내용이 검열되었습니다.'),
                ctx.channel.sendMedia(KnownChatType.PHOTO, {
                    name: 'sad.png',
                    data: sorryForTheInconvenienceImg,
                    width: 720,
                    height: 192,
                    ext: 'png'
                })
            ]);

            notifyMap.set(ctx.channel, true);
            return;
        }

        let sentChatRes = await ctx.channel.sendChat(nonSensitiveText);
        if (!sentChatRes.success) return;

        await processGossip({ ...ctx, data: new TalkChatData(sentChatRes.result) }, 1.1);
    }
}
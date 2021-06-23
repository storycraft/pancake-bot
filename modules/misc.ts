/*
 * Created on Sat May 01 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatBuilder, KnownChatType, MentionContent, ReplyAttachment, ReplyContent, TalkChannel } from "node-kakao";
import { BotModule, ModuleDescriptor, TalkContext } from "../api/bot";
import { ChatCmdListener, CommandInfo } from "../api/command";
import fetch from 'node-fetch';
import { Isolate } from "isolated-vm";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'misc',
    name: 'misc',

    desc: '잡 기능'

}

export default function moduleInit(mod: BotModule) {
    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['say'],
            { usage: 'say (메세지)', description: '봇이 메세지를 따라합니다' },
            sayCommand
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['big'],
            { usage: 'big (글자)', description: '크기가 큰 글자를 보냅니다' },
            bigCommand
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['coin'],
            { usage: 'coin', description: '한강물 온도 알아보기' },
            coinCommand
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['roll'],
            { usage: 'roll [최대 숫자]', description: '랜덤 뽑기 (최소: 0, 기본: 100)' },
            rollCommand
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['readers'],
            { usage: 'readers', description: '채팅 읽은 사람 확인하기' },
            readersCommand
        )
    );

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['exec'],
            { usage: 'exec (코드)', description: '샌드박스 코드 실행기 (실행 제한 30초)' },
            execCommand
        )
    );

}

function sayCommand(info: CommandInfo, ctx: TalkContext<TalkChannel>) {
    const senderInfo = ctx.data.getSenderInfo(ctx.channel);
    const builder = new ChatBuilder();

    if (senderInfo) {
        builder.append(new MentionContent(senderInfo));
        builder.text(' ');
    } else {
        builder.text('(알수없음)');
    }

    if (info.args.length < 1) {
        builder.text('???');
    } else {
        builder.text(info.args);
    }
    
    ctx.channel.sendChat(builder.build(KnownChatType.TEXT));
}

function bigCommand(info: CommandInfo, ctx: TalkContext<TalkChannel>) {
    const builder = new ChatBuilder();

    builder.append(new ReplyContent(ctx.data.chat));

    if (info.args.length !== 1) {
        builder.text('글자는 1자여야 합니다');
    } else {
        builder.text(info.args + '\u200d');
    }

    ctx.channel.sendChat(builder.build(KnownChatType.REPLY));
}

async function coinCommand(info: CommandInfo, ctx: TalkContext<TalkChannel>) {
    const builder = new ChatBuilder();
    builder.append(new ReplyContent(ctx.data.chat));

    try {
        const res = await fetch('https://api.qwer.pw/request/hangang_temp?apikey=guest');
        const json = await res.json();
        const respond = json[1]['respond'];
        if (json[0]['result'] !== 'success') throw new Error(`API throwed error with code: ${respond['code']}`);

        builder.text(
            `${respond['year']}-${respond['month']}-${respond['day']} ${respond['time']}시 기준\n한강 (${respond['location']}): ${respond['temp']} °C`
        );
    } catch (err) {
        builder.text(`API 요청중 오류가 발생했습니다. err: ${err}`);
    }

    ctx.channel.sendChat(builder.build(KnownChatType.REPLY));
}

function rollCommand(info: CommandInfo, ctx: TalkContext<TalkChannel>) {
    const builder = new ChatBuilder();

    builder.append(new ReplyContent(ctx.data.chat));

    let limit;
    if (info.args.length > 0)  {
        limit = Number.parseInt(info.args) + 1;
    } else {
        limit = 101;
    }

    if (isNaN(limit)) limit = 101;

    builder.text(`-> ${Math.floor(Math.random() * limit)}`);

    ctx.channel.sendChat(builder.build(KnownChatType.REPLY));
}

const isolate = new Isolate();
const execSet: WeakSet<TalkChannel> = new WeakSet();
async function execCommand(info: CommandInfo, ctx: TalkContext<TalkChannel>) {
    const builder = new ChatBuilder();

    builder.append(new ReplyContent(ctx.data.chat));

    const channel = ctx.channel;

    if (info.args.length < 1) {
        builder.text(`실행 결과가 없습니다`);
        await channel.sendChat(builder.build(KnownChatType.REPLY));
        return;
    }

    if (execSet.has(ctx.channel)) {
        builder.text(`이미 실행중인 코드가 있습니다. 실행이 끝날때까지 기다려주세요.`);
        await channel.sendChat(builder.build(KnownChatType.REPLY));
        return;
    }

    try {
        execSet.add(channel);

        const jsContext = await isolate.createContext();
        const result = await jsContext.eval(info.args, { timeout: 30000 });

        builder.text(`result: ${result}`);
    } catch (err) {
        builder.text(`실행중 오류가 발생했습니다. err: ${err}`);
    } finally {
        execSet.delete(channel);
    }

    channel.sendChat(builder.build(KnownChatType.REPLY));
}

function readersCommand(info: CommandInfo, ctx: TalkContext<TalkChannel>) {
    const builder = new ChatBuilder();

    builder.append(new ReplyContent(ctx.data.chat));

    if (ctx.data.originalType !== KnownChatType.REPLY) {
        builder.text('확인할 채팅을 답장기능을 통해 선택해주세요');
    } else {
        const reply = ctx.data.attachment<ReplyAttachment>();
        const logId = reply['src_logId'];

        if (logId) {
            const readers = ctx.channel.getReaders({ logId });
            builder.text(`읽은 사람 (${readers.length})\n${readers.map(reader => ` - ${reader.nickname}`).join('\n')}`);
        } else {
            builder.text('선택한 메세지 정보에 오류가 있습니다');
        }
    }
    
    ctx.channel.sendChat(builder.build(KnownChatType.REPLY));
}

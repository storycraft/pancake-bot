/*
 * Created on Sat May 01 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { KnownChatType, OpenChannelUserPerm, TalkChannel, TalkOpenChannel } from "node-kakao";
import { BotModule, ConsoleContext, ModuleDescriptor, TalkContext } from "../api/bot";
import { ChatCmdListener, CommandHelpMap, CommandInfo } from "../api/command";
import { Logger } from "../api/logger";
import { LONG_CHAT_SPLITTER } from "../api/util";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'man',
    name: 'manual',

    desc: '명령어 도움말 제공'

}

export default function moduleInit(mod: BotModule) {
    mod.commandHandler.normal.addListener(
        new ChatCmdListener(
            ['help', 'man'],
            { usage: 'help', description: '명령어 도움말을 가져옵니다' },
            normalHelp
        )
    );

    mod.commandHandler.open.addListener(
        new ChatCmdListener(
            ['help', 'man'],
            { usage: 'help', description: '명령어 도움말을 가져옵니다' },
            openHelp
        )
    );

    mod.commandHandler.console.addListener(
        new ChatCmdListener(
            ['help', 'man'],
            { usage: 'help', description: '명령어 도움말을 가져옵니다' },
            (info, ctx) => consoleHelp(info, ctx, mod.logger)
        )
    );
}

async function normalHelp(info: CommandInfo, ctx: TalkContext<TalkChannel>) {
    let man = `명령어 도움말${LONG_CHAT_SPLITTER}\n\n`;

    const prefix = ctx.bot.config.commandPrefix;

    for (const mod of ctx.bot.allModule()) {
        man += `${mod.name} (${mod.id})\n${constructHelpText(prefix, OpenChannelUserPerm.OWNER, mod.commandHandler.normalHelpMap())}`;
    }

    await ctx.channel.sendMedia(KnownChatType.TEXT, {
        data: Buffer.from(man),
        name: 'man.txt',
        ext: 'txt'
    });
}

async function openHelp(info: CommandInfo, ctx: TalkContext<TalkOpenChannel>) {
    let man = `명령어 도움말${LONG_CHAT_SPLITTER}\n\n`;

    const userInfo = ctx.channel.getUserInfo(ctx.data.chat.sender);

    const prefix = ctx.bot.config.commandPrefix;
    const perm = userInfo ? userInfo.perm : OpenChannelUserPerm.NONE;

    for (const mod of ctx.bot.allModule()) {
        man += `${mod.name} (${mod.id})\n${constructHelpText(prefix, perm, mod.commandHandler.openHelpMap())}`;
    }

    await ctx.channel.sendMedia(KnownChatType.TEXT, {
        data: Buffer.from(man),
        name: 'man.txt',
        ext: 'txt'
    });
}

function consoleHelp(info: CommandInfo, ctx: ConsoleContext, logger: Logger) {
    let man = `명령어 도움말${LONG_CHAT_SPLITTER}\n\n`;

    for (const mod of ctx.bot.allModule()) {
        man += `${mod.name} (${mod.id})\n${constructHelpText('', OpenChannelUserPerm.OWNER, mod.commandHandler.consoleHelpMap())}`;
    }

    logger.info(man);
}

function constructHelpText(cmdPrefix: string, perm: OpenChannelUserPerm, iter: IterableIterator<CommandHelpMap>): string {
    let text = '\n';
    let i = 0;
    for (const helpMap of iter) {
        if (helpMap.executeLevel && (helpMap.executeLevel & perm) === 0) continue;

        text += `(${i++}) ${cmdPrefix}${helpMap.usage}\n`;

        if (helpMap.description) {
            text += helpMap.description + '\n';
        }

        text += '\n';
    }

    return text;
}

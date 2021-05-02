/*
 * Created on Sat May 01 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long, OpenChannelUserPerm, OpenLinkProfiles, TalkNormalChannel, TalkOpenChannel } from "node-kakao";
import { BotModule, ModuleDescriptor } from "../api/bot";
import { ChatCmdListener, CommandInfo, ConsoleCmdListener } from "../api/command";
import * as OpenChannelPerms from '../api/open-channel-perms';

export const MODULE_DESC: ModuleDescriptor = {

    id: 'util',
    name: 'util',

    desc: '봇 제어 명령어들을 제공합니다'

}

export type UtilOptions = {

    profile: OpenLinkProfiles

};

export default function moduleInit(mod: BotModule, options: UtilOptions) {
    mod.commandHandler.normal.addListener(
        new ChatCmdListener(
            ['leave'],
            { usage: 'leave', description: '봇을 채팅방에서 나가게 합니다' },
            async (info, ctx) => {
                const res = await ctx.bot.client.channelList.normal.leaveChannel(ctx.channel);
                if (!res.success) {
                    await ctx.channel.sendChat(`작업이 실패했습니다. status: ${res.status}`);
                }
            }
        )
    );

    mod.commandHandler.open.addListener(
        new ChatCmdListener(
            ['leave'],
            { usage: 'leave', description: '봇을 오픈 채팅방에서 나가게 합니다', executeLevel: OpenChannelUserPerm.OWNER },
            async (info, ctx) => {
                const res = await ctx.bot.client.channelList.open.leaveChannel(ctx.channel);
                if (!res.success) {
                    await ctx.channel.sendChat(`작업이 실패했습니다. status: ${res.status}`);
                }
            }
        )
    );

    mod.commandHandler.console.addListener(
        new ConsoleCmdListener(
            ['stop', 'exit'],
            { usage: 'stop', description: '봇을 종료합니다' },
            () => {
                mod.logger.info('봇 종료중...');
                mod.bot.stop();
                process.exit(0);
            }
        )
    );

    mod.commandHandler.console.addListener(
        new ConsoleCmdListener(
            ['relogin'],
            { usage: 'relogin', description: '봇 클라이언트를 재로그인 합니다' },
            () => mod.bot.refreshSession().then()
        )
    );

    mod.commandHandler.console.addListener(
        new ConsoleCmdListener(
            ['joinopen'],
            { usage: 'joinopen (오픈 채팅방 url)[;(패스코드)]', description: '해당 오픈채팅방에 참여합니다' },
            async (info: CommandInfo) => {
                if (info.args.length < 1) {
                    mod.logger.error('오픈 채팅방 url이 필요합니다');
                    return;
                }

                const separator = info.args.lastIndexOf(';');

                const { url, passcode }: { url: string, passcode?: string } =
                separator < 0
                ? { url: info.args }
                : { url: info.args.slice(0, separator), passcode: info.args.slice(separator + 1) };

                const openChannelList = mod.bot.client.channelList.open;

                const joinInfoRes = await openChannelList.getJoinInfo(url);
                if (!joinInfoRes.success) {
                    mod.logger.error(`해당 오픈 채팅방을 찾는중 오류가 발생했습니다. status: ${joinInfoRes.status}`);
                    return;
                }
                
                const res = await openChannelList.joinChannel(joinInfoRes.result.openLink, options.profile, passcode);
                if (!res.success) {
                    mod.logger.error(`채팅방에 참여하지 못했습니다. status: ${res.status}`);
                    return;
                }

                const openLink = joinInfoRes.result.openLink;
                mod.logger.info(`오픈 채팅방 ${openLink.linkName} (${openLink.linkId}) 에 참여했습니다`);
            }
        )
    );

    mod.commandHandler.console.addListener(
        new ConsoleCmdListener(
            ['list'],
            { usage: 'list [채팅방 타입]', description: '현재 봇 클라이언트가 참여중인 모든 방을 표시합니다. 채팅방 타입이 제공되었을 경우 해당 타입의 채팅방만 표시합니다.' },
            (info: CommandInfo) => {
                const channelList = mod.bot.client.channelList;

                let str = '현재 참여중인 방 목록\n';

                let i = 0;
                for (const channel of channelList.all()) {
                    if (info.args.length > 0 && channel.info.type !== info.args) continue;
                    str += `(${i}) type: "${channel.info.type}" id: ${channel.channelId} name: "${channel.getDisplayName()}" users: ${channel.userCount} lastChatId: ${channel.info.lastChatLogId}\n`;
                    i++;
                }

                mod.logger.info(str);
            }
        )
    );

    mod.commandHandler.console.addListener(
        new ConsoleCmdListener(
            ['leave'],
            { usage: 'leave (채팅방 id)', description: '해당 id의 채팅방을 나갑니다' },
            async (info: CommandInfo) => {
                if (info.args.length < 1) {
                    mod.logger.error('채팅방 id가 필요합니다');
                    return;
                }

                let channelId: Long;
                try {
                    channelId = Long.fromString(info.args);
                } catch(err) {
                    mod.logger.error(`올바르지 않은 채팅방 id입니다. err: ${err}`);
                    return;
                }

                const channelList = mod.bot.client.channelList;

                const normal = channelList.normal.get(channelId);
                if (normal) {
                    const res = await channelList.normal.leaveChannel(normal);

                    if (!res.success) {
                        mod.logger.error(`채팅방을 나가지 못했습니다. status: ${res.status}`);
                        return;
                    }

                    mod.logger.info(`일반 채팅방 ${normal.getDisplayName()} 을 나갔습니다`);
                    return;
                }

                const open = channelList.open.get(channelId);
                if (open) {
                    const res = await channelList.open.leaveChannel(open);

                    if (!res.success) {
                        mod.logger.error(`채팅방을 나가지 못했습니다. status: ${res.status}`);
                        return;
                    }

                    mod.logger.info(`오픈 채팅방 ${open.getDisplayName()} 을 나갔습니다`);
                    return;
                }

                mod.logger.error('해당 채팅방을 찾을 수 없습니다');
            }
        )
    );
}

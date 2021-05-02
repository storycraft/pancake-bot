/*
 * Created on Sun May 02 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import imageSize from "image-size";
import fetch from "node-fetch";
import { KnownChatType, TalkChannel } from "node-kakao";
import PixivApp from "pixiv-app-api";
import { BotModule, ModuleDescriptor, TalkContext } from "../../api/bot";
import { ChatCmdListener, CommandInfo } from "../../api/command";
import { PixivApi } from "./app";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'pixiv',
    name: 'pixiv',

    desc: 'Pixiv 일러스트 관련 모듈'

}

export type ModuleOptions = {

    api: {
        username: string,
        password: string
    }

};

export default function moduleInit(mod: BotModule, options: ModuleOptions) {
    if (!options.api || !options.api.username || !options.api.password) {
        mod.logger.warn('계정 정보가 제공되지 않았습니다. 모듈을 비활성화 합니다.');
        mod.bot.unloadModule(mod.id);
        return;
    }

    const api = new PixivApi(new PixivApp(options.api.username, options.api.password));

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['pixiv'],
            { usage: 'pixiv (일러스트 id)', description: '해당 id의 일러스트를 가져옵니다' },
            (info, ctx) => pixivCommand(api, info, ctx)
        )
    );

}

async function pixivCommand(api: PixivApi, info: CommandInfo, ctx: TalkContext<TalkChannel>) {
    let id = -1;
    try {
        id = Number.parseInt(info.args);
        if (isNaN(id)) throw new Error('올바르지 않은 id 형식');
    } catch(err) {
        await ctx.channel.sendChat(`id 파싱중 오류가 발생했습니다. err: ${err}`);
        return;
    }

    try {
        const app = await api.getApp();

        let detail = await app.illustDetail(id);
        let illust = detail.illust;

        let url = illust.imageUrls.large || illust.imageUrls.medium;

        let res = await fetch(url, {
            headers: {
                Referer: 'http://www.pixiv.net/'
            }
        });

        const data = await res.buffer();

        const size = { width: 256, height: 256 };
        try {
            const imageInfo = imageSize(data);
            if (imageInfo.width) size.width = imageInfo.width;
            if (imageInfo.height) size.height = imageInfo.height;
        } catch (err) {

        }

        await ctx.channel.sendMedia(KnownChatType.PHOTO, {
            name: 'illust.png',
            data,
            ext: 'png',
            width: size.width,
            height: size.height
        });
        await ctx.channel.sendChat(`${illust.title}\nby ${illust.user.name}\n\n${illust.tags.map((tag) => `#${tag.name}`).join(', ')}\n\nhttps://www.pixiv.net/artworks/${illust.id}`);
    } catch(err) {
        await ctx.channel.sendChat(`api 요청중 오류가 발생했습니다. err: ${err}`);
        return;
    }
}

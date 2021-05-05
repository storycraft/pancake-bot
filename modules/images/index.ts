/*
 * Created on Tue May 04 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import jimp from "jimp";
import { ChatBuilder, Chatlog, KnownChatType, PhotoAttachment, ReplyAttachment, ReplyContent, stream, TalkChatData } from "node-kakao";
import { BotModule, ModuleDescriptor } from "../../api/bot";
import { ChatCmdListener, CommandHandler, CommandHelpMap, CommandInfo, TextCommandParser } from "../../api/command";
import { ImageContext } from "./context";
import { ImageCmdListener, createChatImageProcessor } from "./handler";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'images',
    name: 'images',

    desc: '이미지 편집기능 제공'

}

export default function moduleInit(mod: BotModule) {
    const subParser = new TextCommandParser('', ':');
    const subHandler = new CommandHandler<ImageContext>();

    function addImageCommand(
        commands: string[],
        helpMap: CommandHelpMap,
        handler: (info: CommandInfo, ctx: ImageContext) => void | Promise<void>
    ) {
        mod.commandHandler.any.addListener(
            new ChatCmdListener(
                commands,
                helpMap,
                createChatImageProcessor(handler)
            )
        );

        subHandler.addListener(
            new ImageCmdListener(
                commands,
                helpMap,
                handler
            )
        );
    }

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['img'],
            { usage: 'img (명령어 1);[명령어 2]...', description: '이미지 관련 명령어들을 순서대로 실행합니다. 각 명령어는 줄바꿈 또는 세미콜론(;) 으로 구별합니다.' },
            async (info, ctx) => {
                const rawCommands = info.args.split(/\n|;/).filter(rawCmd => rawCmd !== '');

                const subCommands: CommandInfo[] = [];
                for (let i = 0; i < rawCommands.length; i++) {
                    const cmd = subParser.parse(rawCommands[i]);

                    if (!cmd) {
                        await ctx.channel.sendChat(
                            new ChatBuilder()
                            .append(new ReplyContent(ctx.data.chat))
                            .text(`${i + 1} 번째 명령어를 파싱하지 못했습니다`)
                            .build(KnownChatType.REPLY)
                        );
                        return;
                    }

                    subCommands.push(cmd);
                }

                if (subCommands.length < 1) {
                    await ctx.channel.sendChat(
                        new ChatBuilder()
                        .append(new ReplyContent(ctx.data.chat))
                        .text('명령어가 없습니다')
                        .build(KnownChatType.REPLY)
                    );
                    return;
                }

                try {
                    await createChatImageProcessor(async (info, ctx) => {
                        for (let i = 0; i < subCommands.length; i++) {
                            const sub = subCommands[i];
    
                            const res = await subHandler.dispatch(sub, ctx);
                            if (!res) throw new Error(`${i} 번 명령어 ${sub.command} 를 찾을 수 없습니다.`);
                        }
                    })(info, ctx);
                } catch (err) {
                    await ctx.channel.sendChat(
                        new ChatBuilder()
                        .append(new ReplyContent(ctx.data.chat))
                        .text(`이미지 처리중 오류가 발생했습니다. err: ${err}`)
                        .build(KnownChatType.REPLY)
                    );
                }
            }
        )
    );

    addImageCommand(
        ['crop'],
        { usage: 'crop (x) (y) (width) (height)', description: '이미지 자르기' },
        (info, ctx) => {
            const args = info.args.split(' ');

            if (args.length < 4) throw new Error('인자가 4개 필요합니다');

            const x = Number.parseFloat(args[0]);
            if (isNaN(x)) throw new Error('x는 실수여야 합니다');

            const y = Number.parseFloat(args[1]);
            if (isNaN(y)) throw new Error('y는 실수여야 합니다');

            const width = Number.parseFloat(args[2]);
            if (isNaN(width)) throw new Error('width는 실수여야 합니다');
    
            const height = Number.parseFloat(args[3]);
            if (isNaN(height)) throw new Error('height는 실수여야 합니다');

            ctx.image.crop(x, y, width, height);
        }
    );

    addImageCommand(
        ['invert'],
        { usage: 'invert', description: '선택된 채팅의 이미지 반전' },
        (info, ctx) => {
            ctx.image.invert();
        }
    );

    addImageCommand(
        ['blur'],
        { usage: 'blur (효과 반지름 px)', description: '이미지에 흐림효과 적용' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('효과 반지름이 제공되지 않았습니다');
            let radius = Number.parseFloat(info.args);

            if (isNaN(radius)) throw new Error('효과 반지름은 실수여야 합니다');

            ctx.image.blur(radius);
        }
    );

    addImageCommand(
        ['gaussian'],
        { usage: 'gaussian (효과 반지름 px)', description: '이미지에 가우시안 흐림효과 적용' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('효과 반지름이 제공되지 않았습니다');
            let radius = Number.parseFloat(info.args);

            if (isNaN(radius)) throw new Error('효과 반지름은 실수여야 합니다');

            ctx.image.gaussian(radius);
        }
    );

    addImageCommand(
        ['grayscale', 'greyscale'],
        { usage: 'grayscale', description: '이미지 흑백화' },
        (info, ctx) => {
            ctx.image.grayscale();
        }
    );

    addImageCommand(
        ['opaque'],
        { usage: 'opaque', description: '이미지에서 투명도 제거' },
        (info, ctx) => {
            ctx.image.opaque();
        }
    );

    addImageCommand(
        ['contrast'],
        { usage: 'contrast (-1 ~ 1)', description: '이미지 대비 변경' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('대비 수치가 제공되지 않았습니다');
            let val = Number.parseFloat(info.args);

            if (isNaN(val)) throw new Error('대비 수치는 실수여야 합니다');
            if (val < -1 || val > 1) throw new Error('대비 수치의 유효 범위는 -1 ~ 1 입니다');

            ctx.image.contrast(val);
        }
    );

    addImageCommand(
        ['brightness'],
        { usage: 'brightness (-1 ~ 1)', description: '이미지 밝기 변경' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('밝기 수치가 제공되지 않았습니다');
            let val = Number.parseFloat(info.args);

            if (isNaN(val)) throw new Error('밝기 수치는 실수여야 합니다');
            if (val < -1 || val > 1) throw new Error('밝기 수치의 유효 범위는 -1 ~ 1 입니다');

            ctx.image.brightness(val);
        }
    );

    addImageCommand(
        ['dither16'],
        { usage: 'dither16', description: 'dither16 효과 적용' },
        (info, ctx) => {
            ctx.image.dither16();
        }
    );

    addImageCommand(
        ['dither565'],
        { usage: 'dither565', description: 'dither565 효과 적용' },
        (info, ctx) => {
            ctx.image.dither565();
        }
    );

    addImageCommand(
        ['sepia'],
        { usage: 'sepia', description: 'sepia 효과 적용' },
        (info, ctx) => {
            ctx.image.sepia();
        }
    );

    addImageCommand(
        ['normalize'],
        { usage: 'normalize', description: '이미지 색 정규화' },
        (info, ctx) => {
            ctx.image.normalize();
        }
    );

    addImageCommand(
        ['posterize'],
        { usage: 'posterize (효과 수치)', description: '이미지 포스터화 효과' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('효과 수치가 제공되지 않았습니다');
            let val = Number.parseInt(info.args);

            if (isNaN(val)) throw new Error('효과 수치는 정수여야 합니다');
            if (val < 0 || val > 255) throw new Error('효과 수치의 유효 범위는 0 ~ 255 입니다');

            ctx.image.posterize(val);
        }
    );

    addImageCommand(
        ['flip-x'],
        { usage: 'flip-x', description: '이미지 가로로 뒤집기' },
        (info, ctx) => {
            ctx.image.flip(true, false);
        }
    );

    addImageCommand(
        ['flip-y'],
        { usage: 'flip-y', description: '이미지 세로로 뒤집기' },
        (info, ctx) => {
            ctx.image.flip(false, true);
        }
    );


    addImageCommand(
        ['rotate'],
        { usage: 'rotate (각도)', description: '이미지 회전' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('회전 각도가 제공되지 않았습니다');
            let amount = Number.parseFloat(info.args);

            if (isNaN(amount)) throw new Error('각도는 실수여야 합니다');

            ctx.image.rotate(amount);
        }
    );

    addImageCommand(
        ['fade'],
        { usage: 'fade (페이드 수치 0 ~ 1)', description: '이미지 페이드' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('페이드 수치가 제공되지 않았습니다');
            let val = Number.parseFloat(info.args);

            if (isNaN(val)) throw new Error('페이드 수치는 실수여야 합니다');
            if (val < 0 || val > 1) throw new Error('페이드 수치의 유효 범위는 0 ~ 1 입니다');

            ctx.image.fade(val);
        }
    );

    addImageCommand(
        ['opacity'],
        { usage: 'opacity (투명도 0 ~ 1)', description: '이미지 투명도 변경' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('투명도가 제공되지 않았습니다');
            let val = Number.parseFloat(info.args);

            if (isNaN(val)) throw new Error('투명도는 실수여야 합니다');
            if (val < 0 || val > 1) throw new Error('투명도 유효 범위는 0 ~ 1 입니다');

            ctx.image.opacity(val);
        }
    );

}

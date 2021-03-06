/*
 * Created on Tue May 04 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import Jimp from "jimp";
import { ChatBuilder, KnownChatType, ReplyContent } from "node-kakao";
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
            if (isNaN(x) || x < 0) throw new Error('x는 0 이상인 실수여야 합니다');

            const y = Number.parseFloat(args[1]);
            if (isNaN(y) || y < 0) throw new Error('y는 0 이상인 실수여야 합니다');

            const width = Number.parseFloat(args[2]);
            if (isNaN(width) || width < 0) throw new Error('width는 0 이상인 실수여야 합니다');
    
            const height = Number.parseFloat(args[3]);
            if (isNaN(height) || height < 0) throw new Error('height는 0 이상인 실수여야 합니다');

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
        { usage: 'blur (radius)', description: '이미지에 흐림효과 적용' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('효과 반지름이 제공되지 않았습니다');
            const radius = Number.parseFloat(info.args);

            if (isNaN(radius)) throw new Error('효과 반지름은 실수여야 합니다');

            ctx.image.blur(radius);
        }
    );

    addImageCommand(
        ['gaussian'],
        { usage: 'gaussian (radius)', description: '이미지에 가우시안 흐림효과 적용' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('효과 반지름이 제공되지 않았습니다');
            const radius = Number.parseFloat(info.args);

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
            const val = Number.parseFloat(info.args);

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
            const val = Number.parseFloat(info.args);

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
        { usage: 'posterize (amount)', description: '이미지 포스터화 효과' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('amount가 제공되지 않았습니다');
            let val = Number.parseInt(info.args);

            if (isNaN(val)) throw new Error('amount는 정수여야 합니다');
            if (val < 0 || val > 255) throw new Error('amount의 유효 범위는 0 ~ 255 입니다');

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
        { usage: 'rotate (degree)', description: '이미지 회전' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('회전 각도가 제공되지 않았습니다');
            const amount = Number.parseFloat(info.args);

            if (isNaN(amount)) throw new Error('각도는 실수여야 합니다');

            ctx.image.rotate(amount);
        }
    );

    addImageCommand(
        ['fade'],
        { usage: 'fade (amount 0 ~ 1)', description: '이미지 페이드' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('페이드 수치가 제공되지 않았습니다');
            const val = Number.parseFloat(info.args);

            if (isNaN(val)) throw new Error('페이드 수치는 실수여야 합니다');
            if (val < 0 || val > 1) throw new Error('페이드 수치의 유효 범위는 0 ~ 1 입니다');

            ctx.image.fade(val);
        }
    );

    addImageCommand(
        ['opacity'],
        { usage: 'opacity (opacity 0 ~ 1)', description: '이미지 투명도 변경' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('투명도가 제공되지 않았습니다');
            const val = Number.parseFloat(info.args);

            if (isNaN(val)) throw new Error('투명도는 실수여야 합니다');
            if (val < 0 || val > 1) throw new Error('투명도 유효 범위는 0 ~ 1 입니다');

            ctx.image.opacity(val);
        }
    );

    addImageCommand(
        ['pixelate'],
        { usage: 'pixelate (amount) [(x) (y) (width) (height)]', description: '이미지 전체 또는 특정 부분에 픽셀화 효과 적용' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('크기가 제공되지 않았습니다');

            const args = info.args.split(' ');

            const size = Number.parseFloat(args[0]);
            
            if (isNaN(size)) throw new Error('픽셀화 크기는 실수여야 합니다');
            if (size < 0) throw new Error('픽셀화 크기는 음수 일 수 없습니다');

            if (args.length > 4) {
                const x = Number.parseFloat(args[1]);
                if (isNaN(x) || x < 0) throw new Error('x는 0 이상인 실수여야 합니다');
    
                const y = Number.parseFloat(args[2]);
                if (isNaN(y) || y < 0) throw new Error('y는 0 이상인 실수여야 합니다');
    
                const width = Number.parseFloat(args[3]);
                if (isNaN(width) || width < 0) throw new Error('width는 0 이상인 큰 실수여야 합니다');
        
                const height = Number.parseFloat(args[4]);
                if (isNaN(height) || height < 0) throw new Error('height는 0 이상인 큰 실수여야 합니다');
                
                ctx.image.pixelate(size, x, y, width, height);
            } else {
                ctx.image.pixelate(size);
            }
        }
    );

    addImageCommand(
        ['emboss'],
        { usage: 'emboss', description: '이미지에 emboss 효과 적용' },
        (info, ctx) => {
            ctx.image.convolute([[-2, -1, 0], [-1, 1, 1], [0, 1, 2]]);
        }
    );

    addImageCommand(
        ['sharpen'],
        { usage: 'sharpen', description: '이미지에 sharpen 효과 적용' },
        (info, ctx) => {
            ctx.image.convolute([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]);
        }
    );

    addImageCommand(
        ['edge-detect'],
        { usage: 'edge-detect', description: '이미지에 edge-detection 효과 적용' },
        (info, ctx) => {
            ctx.image
            .grayscale()
            .convolute([[0, 1, 0], [1, -4, 1], [0, 1, 0]]);
        }
    );

    addImageCommand(
        ['red'],
        { usage: 'red (amount)', description: '이미지 빨간색 채널 수정' },
        (info, ctx) => {
            const amount = Number.parseFloat(info.args);
            if (isNaN(amount)) throw new Error('amount는 실수여야 합니다');

            ctx.image.color([
                { apply: 'red' , params: [amount] }
            ]);
        }
    );

    addImageCommand(
        ['green'],
        { usage: 'green (amount)', description: '이미지 초록색 채널 수정' },
        (info, ctx) => {
            const amount = Number.parseFloat(info.args);
            if (isNaN(amount)) throw new Error('amount는 실수여야 합니다');

            ctx.image.color([
                { apply: 'green' , params: [amount] }
            ]);
        }
    );

    addImageCommand(
        ['blue'],
        { usage: 'blue (amount)', description: '이미지 파란색 채널 수정' },
        (info, ctx) => {
            const amount = Number.parseFloat(info.args);
            if (isNaN(amount)) throw new Error('amount는 실수여야 합니다');

            ctx.image.color([
                { apply: 'blue' , params: [amount] }
            ]);
        }
    );

    addImageCommand(
        ['xor'],
        { usage: 'xor (css color)', description: '인자로 주어진 색과 xor' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('색이 주어지지 않았습니다');

            ctx.image.color([
                { apply: 'xor' , params: [info.args] }
            ]);
        }
    );

    addImageCommand(
        ['hue'],
        { usage: 'hue (degree)', description: '이미지 색 수정 (HSV cylinder hue rotate)' },
        (info, ctx) => {
            const degree = Number.parseFloat(info.args);
            if (isNaN(degree)) throw new Error('degree는 실수여야 합니다');

            ctx.image.color([
                { apply: 'hue' , params: [degree] }
            ]);
        }
    );

    addImageCommand(
        ['overlay'],
        { usage: 'overlay (css color)', description: '이미지 색상 오버레이' },
        (info, ctx) => {
            if (info.args.length < 1) throw new Error('인자가 부족합니다');

            const color = Jimp.cssColorToHex(info.args);

            const opacity = (((color >>> 24) & 0xff) / 255) * 100;

            ctx.image.color([
                { apply: 'mix' , params: [info.args, opacity] }
            ]);
        }
    );
}

import { BotModule, ModuleDescriptor } from "../../api/bot/module";
import { ChatCmdListener, CommandInfo } from "../../api/command";
import { TalkChannel } from "node-kakao";

import fetch from "node-fetch";
import { TalkContext } from "../../api/bot";

/**
 * 모듈 정보
 */
export const MODULE_DESC: ModuleDescriptor = {

    id: 'school-meal',
    name: 'school-meal',

    desc: '학교 급식 확인하기'

}

export type ModuleOptions = {
    apiKey: string;
};

export default function moduleInit(mod: BotModule, options: ModuleOptions) {
    if (!options.apiKey) {
        mod.logger.warn('neis.go.kr api키가 필요합니다.');
        mod.bot.unloadModule(mod.id);
        return;
    }

    const apiKey = options.apiKey;

    mod.commandHandler.any.addListener(
        new ChatCmdListener(
            ['schoolMeal', 'sm'],
            { usage: 'schoolMeal (학교명) (날짜) \n ex) schoolMeal 배방고등학교 20210507', description: '급식을 가져옵니다'},
            (info, ctx) => smCommand(apiKey, info, ctx)
        )
    );
}

async function smCommand(apiKey: string, info: CommandInfo, ctx: TalkContext<TalkChannel>) {
    let schoolCode: string = ''; //표준학교코드
    let scCode: string = ''; //시도교육청코드

    const args: string[] = info.args.split(' ');

    try {
        const res = await fetch(`https://open.neis.go.kr/hub/schoolInfo?KEY=${encodeURIComponent(apiKey)}&Type=json&SCHUL_NM=${encodeURIComponent(args[0])}`);
        const resj = await res.json();

        schoolCode = resj.schoolInfo[1].row[0].SD_SCHUL_CODE;
        scCode = resj.schoolInfo[1].row[0].ATPT_OFCDC_SC_CODE;

        if(!schoolCode || !scCode){
            throw new Error("학교 이름이 바르지 않은 듯 합니다.");
        }
    } catch(err) {
        await ctx.channel.sendChat(`err: ${err}`);
        return;
    }

    try {
        let dayStr = '';

        if(args.length < 2){
            const today = new Date();
            dayStr = `${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
        }else{
            dayStr = args[1];
        }
        
        const smData = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?&KEY=${apiKey}&Type=json&pSize=1&SD_SCHUL_CODE=${schoolCode}&ATPT_OFCDC_SC_CODE=${scCode}&MLSV_YMD=${dayStr}`);
        const smDataj = await smData.json();

        console.log(`https://open.neis.go.kr/hub/mealServiceDietInfo?&KEY=${apiKey}&Type=json&pSize=1&SD_SCHUL_CODE=${schoolCode}&ATPT_OFCDC_SC_CODE=${scCode}&MLSV_YMD=${dayStr}`);

        await ctx.channel.sendChat(smDataj.mealServiceDietInfo[1].row[0].DDISH_NM.replace(/<br\/>/g, '\n'));
    } catch(err) {
        await ctx.channel.sendChat(`급식이 없습니다. err: ${err}`);
        return;
    }
}

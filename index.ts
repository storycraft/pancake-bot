/*
 * Created on Wed Apr 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkProfiles } from 'node-kakao';
import { BotCredential, Bot } from './api/bot';
import { FileLogger, GroupLogger, StyledLogger, WritableLogger } from './api/logger';
import packages from './package.json';
import * as os from 'os';
import * as readline from 'readline';
import { BotModuleLoader } from './api/bot/loader';
import { NodeKakaoDB } from 'node-kakao-db';
import firebase from "firebase";
import { FirebaseDatabase } from './modules/chatbot/database';

async function main(credential: BotCredential) {
    const dbClient = new NodeKakaoDB({
        dataDir: './client-data'
    });

    const logger = new GroupLogger([
        new StyledLogger(new WritableLogger(process.stdout, process.stderr), true, true, true),
        new StyledLogger(new FileLogger('logs'), true, true, false)
    ]);

    logger.info(`${packages.name} ${packages.version} Node: ${process.versions.node} os: ${process.platform} mem: ${(os.totalmem() / 1073741824).toFixed(2)} GB`);

    const botRes = await Bot.start(
        credential,
        dbClient,
        './data',
        logger
    );
    if (!botRes.success) {
        logger.fatal(`봇 로그인중 오류가 발생했습니다. status: ${botRes.status}`);
        process.exit(-1);
    }

    const bot = botRes.result;

    const app = firebase.initializeApp({
        databaseURL: process.env['FIREBASE_CHAT_BOT_RT_DB']
    })

    // 모듈 로딩
    const loader = new BotModuleLoader(bot, 'modules');
    try {
        await Promise.all([
            loader.load('chat'),
            loader.load('util', { profile: {} as OpenLinkProfiles }),
            loader.load('chatbot', { database: new FirebaseDatabase(app.database()) }),
            loader.load('man'),
            loader.load('misc'),
            loader.load('open-channel-manager'),
            loader.load('inspect'),
            // 픽시브 관련 라이브러리 고장으로 비활성화
            // loader.load('pixiv', { api: { username: process.env['BOT_PIXIV_USERNAME'], password: process.env['BOT_PIXIV_PWD'] } }),
            loader.load('sudo'),
            loader.load('ytdl'),
            loader.load('hash'),
            loader.load('images'),
            // 모듈 미완성으로 인해 비 활성화
            // loader.load('school-meal', { apiKey: process.env['BOT_SCHOOL_MEAL_API'] }),
        ]);
    } catch (err) {
        logger.fatal(`모듈 로딩중 오류가 발생했습니다. err: ${err}`);
        process.exit(-1);
    }

    logger.info('봇이 시작되었습니다');

    const iface = readline.createInterface(process.stdin, process.stdout, undefined, true);

    iface.setPrompt('> ');
    iface.prompt(true);
    iface.on('line', async (text) => {
        await bot.dispatchConsole(text);
        iface.prompt(true);
    });
}

main({
    deviceName: process.env['BOT_DEVICE_NAME'] || '',
    deviceUUID: process.env['BOT_DEVICE_UUID'] || '',
    email: process.env['BOT_ACCOUNT_EMAIL'] || '',
    password: process.env['BOT_ACCOUNT_PWD'] || ''
}).then();

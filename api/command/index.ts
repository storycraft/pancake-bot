/*
 * Created on Tue Apr 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export * from './handler';
export * from './parse';
export * from './argument';

/**
 * 커맨드 객체
 */
export type CommandInfo = {

    /// 파싱되지 않은 원본 문자열
    text: string,

    /// 명령어 네임스페이스
    namespace: string,

    /// 명령어
    command: string,

    /// 명령어 인자
    args: string
}

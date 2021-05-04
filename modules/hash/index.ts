/*
 * Created on Tue May 04 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { BotModule, ModuleDescriptor } from "../../api/bot";
import { addEncodingCmd, addHashCmd, addNodeHashCmd } from "./command-gen";
import * as jsSha from 'js-sha3';
import * as crc from 'crc';
import * as entites from 'entities';
import { binaryEncode } from "./util";

export const MODULE_DESC: ModuleDescriptor = {

    id: 'hash-encode',
    name: 'hash encode',

    desc: '해시와 각종 인코딩 유틸'

}

export default function moduleInit(mod: BotModule) {
    addNodeHashCmd(mod, 'md4');
    addNodeHashCmd(mod, 'md5');
    addNodeHashCmd(mod, 'sha');
    addNodeHashCmd(mod, 'sha1');
    addNodeHashCmd(mod, 'sha224');
    addNodeHashCmd(mod, 'sha256');
    addNodeHashCmd(mod, 'sha384');
    addNodeHashCmd(mod, 'sha512');

    addHashCmd(mod, 'sha3-224', jsSha.sha3_224);
    addHashCmd(mod, 'sha3-256', jsSha.sha3_256);
    addHashCmd(mod, 'sha3-384', jsSha.sha3_384);
    addHashCmd(mod, 'sha3-512', jsSha.sha3_512);

    addHashCmd(mod, 'keccak-224', jsSha.keccak224);
    addHashCmd(mod, 'keccak-256', jsSha.keccak256);
    addHashCmd(mod, 'keccak-384', jsSha.keccak384);
    addHashCmd(mod, 'keccak-512', jsSha.keccak512);

    addHashCmd(mod, 'shake-128', (input) => jsSha.shake_128(input, 128));
    addHashCmd(mod, 'shake-256', (input) => jsSha.shake_256(input, 256));

    addHashCmd(mod, 'crc1', (input) => crc.crc1(input).toString());
    addHashCmd(mod, 'crc8', (input) => crc.crc8(input).toString());
    addHashCmd(mod, 'crc16', (input) => crc.crc16(input).toString());
    addHashCmd(mod, 'crc24', (input) => crc.crc24(input).toString());
    addHashCmd(mod, 'crc32', (input) => crc.crc32(input).toString());
    addHashCmd(mod, 'crc16ccitt', (input) => crc.crc16ccitt(input).toString());
    addHashCmd(mod, 'crc16kermit', (input) => crc.crc16kermit(input).toString());
    addHashCmd(mod, 'crc16modbus', (input) => crc.crc16modbus(input).toString());
    addHashCmd(mod, 'crc16xmodem', (input) => crc.crc16xmodem(input).toString());
    addHashCmd(mod, 'crc81wire', (input) => crc.crc81wire(input).toString());

    addEncodingCmd(mod, 'base64', true, (input) => Buffer.from(input).toString('base64'));
    addEncodingCmd(mod, 'base64', false, (input) => Buffer.from(input, 'base64').toString('utf-8'));
    addEncodingCmd(mod, 'url', true, encodeURI);
    addEncodingCmd(mod, 'url', false, decodeURI);
    addEncodingCmd(mod, 'url-strict', true, encodeURIComponent);
    addEncodingCmd(mod, 'url-strict', false, decodeURIComponent);
    addEncodingCmd(mod, 'html', true, entites.encodeHTML);
    addEncodingCmd(mod, 'html', false, entites.decodeHTML);
    addEncodingCmd(mod, 'xml', true, entites.encodeXML);
    addEncodingCmd(mod, 'xml', false, entites.decodeXML);

    addEncodingCmd(mod, 'bin', true, binaryEncode);
}

/*
 * Created on Tue Apr 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { assert } from 'chai';
import { TextCommandParser } from '../src/command/parse';

describe('Parser', () => {
    
    describe('Text command parse', () => {
        const parser = new TextCommandParser('-', ':');

        it('Invalid text', () => {
            assert.equal(parser.parse('asdf'), null, 'Invalid text should not be parsed!');
        });

        it('Command parsing', () => {
            assert.deepEqual(parser.parse('-test'), {
                namespace: '',
                command: 'test',
                args: '',
                text: '-test'
            });
        });

        it('Command parsing with namespace', () => {
            assert.deepEqual(parser.parse('-sample:test'), {
                namespace: 'sample',
                command: 'test',
                args: '',
                text: '-sample:test'
            });
        });

        it('Command parsing with arguments', () => {
            assert.deepEqual(parser.parse('-test test1 test2'), {
                namespace: '',
                command: 'test',
                args: 'test1 test2',
                text: '-test test1 test2'
            });
        });

    });

});
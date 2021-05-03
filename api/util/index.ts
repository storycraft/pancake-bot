/*
 * Created on Tue Apr 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export * from './chained-iterator';
export * from './chat';
export * from './stream';

export function delay(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}

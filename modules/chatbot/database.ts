/*
 * Created on Fri Jan 17 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import Firebase from 'firebase';

export type DatabaseValuePrimitive = string | number | boolean | null;
export type DatabaseValueObject = object;
export type DatabaseValue = DatabaseValuePrimitive | DatabaseValueObject;

export const PATH_SEPARATOR = '/';

export interface Database<K = string, V = DatabaseValue> {

    getEntry(key: K): DatabaseEntry<K, V>;

}

export interface DatabaseEntry<K = string, V = DatabaseValue> {

    readonly name: string;

    getEntry(key: K): DatabaseEntry<K, V>;

    has(key: K): Promise<boolean>;

    get(key: K): Promise<V | undefined>;
    set(key: K, value: V): Promise<boolean>;

    deleteEntry(): Promise<void>;
    deleteKey(key: K): Promise<void>;

}


export class FirebaseEntry implements DatabaseEntry<string, DatabaseValue> {

    protected reference: Firebase.database.Reference;

    constructor(reference: Firebase.database.Reference) {
        this.reference = reference;
    }

    get name() {
        return this.reference.key || '/';
    }

    async has(key: string): Promise<boolean> {
        return !!(await this.get(key));
    }

    getEntry(key: string): FirebaseEntry {
        return new FirebaseEntry(this.reference.child(key));
    }

    async get(key: string): Promise<DatabaseValue | undefined> {
        let val = await this.reference.child(key).once('value');

        return val.val();
    }

    async set(key: string, value: DatabaseValue): Promise<boolean> {
        await this.reference.child(key).set(value);

        return true;
    }

    async deleteEntry(): Promise<void> {
        await this.reference.remove();
    }

    async deleteKey(key: string): Promise<void> {
        await this.reference.child(key).remove();
    }

}

export class FirebaseDatabase extends FirebaseEntry implements Database {

    private database: Firebase.database.Database;

    constructor(database: Firebase.database.Database) {
        super(database.ref());

        this.database = database;
    }

}

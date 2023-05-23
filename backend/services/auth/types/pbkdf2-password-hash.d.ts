declare module 'pbkdf2-password-hash' {
    export interface Options {
        iterations?: number;
        keylen?: number;
        digest?: string;
        saltlen?: number;
    }

    async function hash(
        password: string,
        salt?: string,
        options?: Options
    ): Promise<string>;
    async function compare(
        password: string,
        passwordHash: string
    ): Promise<boolean>;

    declare const passwordHash = { hash, compare };
    export = passwordHash;
}

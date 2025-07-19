export class JsonUtil {
    public static stringify(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string | null {
        try {
            return JSON.stringify(value, replacer, space);
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    public static parse(text: string, reviver?: (this: any, key: string, value: any) => any): any {
        try {
            return JSON.parse(text, reviver);
        } catch (err) {
            console.error(err);
            return null;
        }
    }
}

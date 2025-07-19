export class TypeUtil {
    public static readonly TEXT_ALLOWED_MAX = 1 << 6;

    public static isPrimitive(value: any): value is string | number | bigint | boolean | Symbol | null | undefined {
        try {
            '' in value;
            return false;
        } catch {
            return true;
        }
    }

    public static isUint(value: any): value is number {
        return Number.isInteger(value) && value >= 0;
    }

    public static isTextAllowedMax(value: any): value is string {
        return !(typeof value !== 'string' || !value.length || value.length > TypeUtil.TEXT_ALLOWED_MAX)
    }
}

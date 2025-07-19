export class TimeUtil {
    public static readonly SECOND = 1000;
    public static readonly MINUTE = 60 * TimeUtil.SECOND;
    public static readonly HOUR = 60 * TimeUtil.MINUTE;
    public static readonly DAY = 24 * TimeUtil.HOUR;

    public static wait(ms: number = 0): Promise<void> {
        return new Promise<void>(resolve => setTimeout(resolve, +ms));
    }

    public static now(): number {
        return Date.now();
    }
}

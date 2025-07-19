export class RandomUtil {
    public static randomInt(min: number, max: number): number {
        min = Math.trunc(min);
        max = Math.trunc(max);
        if (min > max) {
            [min, max] = [max, min];
        }
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    public static randomString(length: number): string {
        return new Array(length).fill(0).map(() => String.fromCharCode(this.randomInt(32, 126))).join('');
    }
}

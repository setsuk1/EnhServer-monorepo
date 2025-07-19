export class FileUtil {
    public static async fetchText(url: string): Promise<string> {
        const response = await fetch(url);
        const text = await response.text();
        return text;
    }

    public static async fetchBase64(url: string) {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;

            reader.readAsDataURL(blob);
        });
    }
}

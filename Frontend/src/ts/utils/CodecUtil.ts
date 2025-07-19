export class CodecUtil {
	public static readonly decoders = {
		utf8: new TextDecoder('utf8', { fatal: true })
	};
	public static readonly encoders = {
		utf8: new TextEncoder()
	}
}

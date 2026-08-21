import { encode } from '@jsquash/webp';
import type {
	WebpEncodeFailure,
	WebpEncodeRequest,
	WebpEncodeSuccess,
} from '@/types/editor';

const workerScope = self as unknown as {
	onmessage: ((event: MessageEvent<WebpEncodeRequest>) => void) | null;
	postMessage: (message: WebpEncodeSuccess | WebpEncodeFailure, transfer?: Transferable[]) => void;
};

workerScope.onmessage = (event) => {
	void encodeFile(event.data);
};

const encodeFile = async ({ id, file }: WebpEncodeRequest): Promise<void> => {
	try {
		const bitmap = await createImageBitmap(file);
		const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
		const context = canvas.getContext('2d', {
			willReadFrequently: true,
		});

		if (!context) {
			throw new Error('Could not create image conversion context');
		}

		context.drawImage(bitmap, 0, 0);
		bitmap.close();

		const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
		const buffer = await encode(imageData, {
			lossless: 1,
			exact: 1,
			method: 6,
		});

		workerScope.postMessage({ id, buffer }, [buffer]);
	} catch (error) {
		workerScope.postMessage({
			id,
			error:
				error instanceof Error
					? error.message
					: 'Could not convert image to WebP',
		});
	}
};

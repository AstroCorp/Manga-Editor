import WebpEncodeWorker from '@/lib/image/webpEncode.worker?worker';
import type { WebpEncodeResponse } from '@/types/editor';

const WEBP_MIME_TYPE = 'image/webp';

type PendingConversion = {
	resolve: (dataUrl: string) => void;
	reject: (error: Error) => void;
};

let worker: Worker | null = null;
let requestId = 0;
const pending = new Map<number, PendingConversion>();

const blobToDataUrl = (blob: Blob): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);

				return;
			}

			reject(new Error('Could not read converted image'));
		};
		reader.onerror = () => {
			reject(reader.error ?? new Error('Could not read converted image'));
		};
		reader.readAsDataURL(blob);
	});
};

const rejectPending = (error: Error) => {
	pending.forEach(({ reject }) => {
		reject(error);
	});
	pending.clear();
	worker?.terminate();
	worker = null;
};

const getWorker = (): Worker => {
	if (worker) {
		return worker;
	}

	worker = new WebpEncodeWorker();
	worker.onmessage = (event: MessageEvent<WebpEncodeResponse>) => {
		const conversion = pending.get(event.data.id);

		if (!conversion) {
			return;
		}

		pending.delete(event.data.id);

		if ('error' in event.data) {
			conversion.reject(new Error(event.data.error));

			return;
		}

		void blobToDataUrl(
			new Blob([event.data.buffer], { type: WEBP_MIME_TYPE }),
		).then(conversion.resolve, conversion.reject);
	};
	worker.onerror = () => {
		rejectPending(new Error('Could not convert image to WebP'));
	};

	return worker;
};

export const convertFileToWebpDataUrl = (file: File): Promise<string> => {
	const id = requestId;

	requestId += 1;

	return new Promise((resolve, reject) => {
		pending.set(id, { resolve, reject });
		getWorker().postMessage({ id, file });
	});
};

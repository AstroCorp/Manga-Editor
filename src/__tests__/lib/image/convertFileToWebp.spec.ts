import { beforeAll, describe, expect, it, vi } from 'vitest';

const postMessage = vi.fn();
let nextResponse: 'success' | 'error' | 'crash' = 'success';

vi.mock('@/lib/image/webpEncode.worker?worker', () => {
	return {
		default: class WebpEncodeWorker {
			onmessage: ((event: MessageEvent) => void) | null = null;
			onerror: (() => void) | null = null;

			postMessage(message: { id: number }) {
				postMessage(message);

				queueMicrotask(() => {
					if (nextResponse === 'crash') {
						this.onerror?.();

						return;
					}

					if (nextResponse === 'error') {
						this.onmessage?.(
							new MessageEvent('message', {
								data: { id: message.id, error: 'bad format' },
							}),
						);

						return;
					}

					const bytes = new TextEncoder().encode('webp');

					this.onmessage?.(
						new MessageEvent('message', {
							data: { id: message.id, buffer: bytes.buffer },
						}),
					);
				});
			}

			terminate() {}
		},
	};
});

describe('convertFileToWebpDataUrl', () => {
	let convertFileToWebpDataUrl: (file: File) => Promise<string>;

	beforeAll(async () => {
		({ convertFileToWebpDataUrl } = await import(
			'@/lib/image/convertFileToWebp'
		));
	});

	it('returns the worker output as a WebP data URL', async () => {
		nextResponse = 'success';

		const file = new File(['png'], 'page.png', { type: 'image/png' });

		await expect(convertFileToWebpDataUrl(file)).resolves.toBe(
			'data:image/webp;base64,d2VicA==',
		);
		expect(postMessage).toHaveBeenCalledWith({
			id: 0,
			file,
		});
	});

	it('rejects when the worker reports a conversion error', async () => {
		nextResponse = 'error';

		await expect(
			convertFileToWebpDataUrl(
				new File(['bad'], 'page.bmp', { type: 'image/bmp' }),
			),
		).rejects.toThrow('bad format');
	});

	it('rejects pending conversions when the worker crashes', async () => {
		nextResponse = 'crash';

		await expect(
			convertFileToWebpDataUrl(
				new File(['crash'], 'page.png', { type: 'image/png' }),
			),
		).rejects.toThrow('Could not convert image to WebP');
	});
});

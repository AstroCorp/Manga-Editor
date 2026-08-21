import { afterEach, describe, expect, it, vi } from 'vitest';

const encode = vi.fn(() => {
	return Promise.resolve(new Uint8Array([1, 2, 3]).buffer);
});

vi.mock('@jsquash/webp', () => {
	return { encode };
});

describe('webpEncode worker', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.resetModules();
		encode.mockClear();
	});

	it('encodes decoded pixels as exact lossless WebP', async () => {
		const imageData = {
			data: new Uint8ClampedArray(24),
			width: 2,
			height: 3,
			colorSpace: 'srgb',
		} as ImageData;
		const close = vi.fn();
		const drawImage = vi.fn();
		const getImageData = vi.fn(() => imageData);
		const postMessage = vi.fn();
		const workerScope: {
			onmessage: ((event: MessageEvent) => void) | null;
			postMessage: typeof postMessage;
		} = {
			onmessage: null,
			postMessage,
		};

		vi.stubGlobal('self', workerScope);
		vi.stubGlobal(
			'createImageBitmap',
			vi.fn(() => {
				return Promise.resolve({ width: 2, height: 3, close });
			}),
		);
		vi.stubGlobal(
			'OffscreenCanvas',
			class {
				width: number;
				height: number;

				constructor(width: number, height: number) {
					this.width = width;
					this.height = height;
				}

				getContext() {
					return { drawImage, getImageData };
				}
			},
		);

		await import('@/lib/image/webpEncode.worker');

		const file = new File(['source'], 'page.png', { type: 'image/png' });

		workerScope.onmessage?.(
			new MessageEvent('message', {
				data: { id: 7, file },
			}),
		);

		await vi.waitFor(() => {
			expect(encode).toHaveBeenCalledWith(imageData, {
				lossless: 1,
				exact: 1,
				method: 6,
			});
		});
		expect(drawImage).toHaveBeenCalled();
		expect(close).toHaveBeenCalled();
		expect(postMessage).toHaveBeenCalledWith(
			{ id: 7, buffer: expect.any(ArrayBuffer) },
			[expect.any(ArrayBuffer)],
		);
	});

	it('reports a conversion error when the canvas context is missing', async () => {
		const postMessage = vi.fn();
		const workerScope: {
			onmessage: ((event: MessageEvent) => void) | null;
			postMessage: typeof postMessage;
		} = {
			onmessage: null,
			postMessage,
		};

		vi.stubGlobal('self', workerScope);
		vi.stubGlobal(
			'createImageBitmap',
			vi.fn(() => {
				return Promise.resolve({ width: 1, height: 1, close: vi.fn() });
			}),
		);
		vi.stubGlobal(
			'OffscreenCanvas',
			class {
				constructor(
					public width: number,
					public height: number,
				) {}

				getContext() {
					return null;
				}
			},
		);

		await import('@/lib/image/webpEncode.worker');

		workerScope.onmessage?.(
			new MessageEvent('message', {
				data: {
					id: 3,
					file: new File(['source'], 'page.png', { type: 'image/png' }),
				},
			}),
		);

		await vi.waitFor(() => {
			expect(postMessage).toHaveBeenCalledWith({
				id: 3,
				error: 'Could not create image conversion context',
			});
		});
	});
});

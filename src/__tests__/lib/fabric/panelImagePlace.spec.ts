import { describe, expect, it, vi } from 'vitest';
import type { Canvas } from 'fabric';

vi.mock('@/lib/image/convertFileToWebp', () => {
	return {
		convertFileToWebpDataUrl: vi.fn(),
	};
});

describe('panelImagePlace', () => {
	it('isImageFile accepts image MIME types only', async () => {
		const { isImageFile } = await import('@/lib/fabric/panelImagePlace');

		expect(isImageFile(new File([], 'a.png', { type: 'image/png' }))).toBe(
			true,
		);
		expect(isImageFile(new File([], 'a.jpg', { type: 'image/jpeg' }))).toBe(
			true,
		);
		expect(
			isImageFile(new File([], 'a.txt', { type: 'text/plain' })),
		).toBe(false);
		expect(isImageFile(new File([], 'a.bin', { type: '' }))).toBe(false);
	});

	it('does not convert a file when the panel is missing', async () => {
		const { placeImageFileInPanel } = await import(
			'@/lib/fabric/panelImagePlace'
		);
		const { convertFileToWebpDataUrl } = await import(
			'@/lib/image/convertFileToWebp'
		);
		const canvas = {
			getObjects: () => [],
		} as unknown as Canvas;

		await expect(
			placeImageFileInPanel({
				canvas,
				panelId: 'missing',
				file: new File(['png'], 'a.png', { type: 'image/png' }),
			}),
		).resolves.toBe(false);
		expect(convertFileToWebpDataUrl).not.toHaveBeenCalled();
	});
});

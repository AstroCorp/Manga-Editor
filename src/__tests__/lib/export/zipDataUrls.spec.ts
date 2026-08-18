import { describe, expect, it } from 'vitest';
import { Uint8ArrayReader, ZipReader } from '@zip.js/zip.js';
import { zipDataUrls } from '@/lib/export/zipDataUrls';

const TINY_PNG =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('zipDataUrls', () => {
	it('packs data URLs into a zip archive', async () => {
		const blob = await zipDataUrls([
			{ filename: 'untitled-page-1.png', dataUrl: TINY_PNG },
			{ filename: 'untitled-page-2.png', dataUrl: TINY_PNG },
		]);

		expect(blob.type).toBe('application/zip');

		const zipReader = new ZipReader(
			new Uint8ArrayReader(new Uint8Array(await blob.arrayBuffer())),
			{ useWebWorkers: false },
		);
		const entries = await zipReader.getEntries();

		expect(entries.map((entry) => entry.filename)).toEqual([
			'untitled-page-1.png',
			'untitled-page-2.png',
		]);

		await zipReader.close();
	});
});

import { describe, expect, it } from 'vitest';
import {
	deleteImageAssetsExcept,
	loadImageAssets,
	saveImageAssets,
} from '@/lib/history/imageAssetDb';

describe('imageAssetDb', () => {
	it('stores and restores image blobs by asset id', async () => {
		await saveImageAssets(
			{
				first: 'data:image/webp;base64,Zmlyc3Q=',
				second: 'data:image/png;base64,c2Vjb25k',
			},
			new Set(['first', 'second']),
		);

		await expect(loadImageAssets(['first', 'second'])).resolves.toEqual({
			first: 'data:image/webp;base64,Zmlyc3Q=',
			second: 'data:image/png;base64,c2Vjb25k',
		});
	});

	it('deletes assets that are no longer referenced', async () => {
		await saveImageAssets(
			{
				keep: 'data:image/webp;base64,a2VlcA==',
				remove: 'data:image/webp;base64,cmVtb3Zl',
			},
			new Set(['keep', 'remove']),
		);
		await deleteImageAssetsExcept(new Set(['keep']));

		await expect(loadImageAssets(['keep'])).resolves.toEqual({
			keep: 'data:image/webp;base64,a2VlcA==',
		});
		await expect(loadImageAssets(['remove'])).rejects.toThrow(
			'Missing image asset: remove',
		);
	});

	it('does not rewrite assets that already exist in IndexedDB', async () => {
		await saveImageAssets(
			{
				keep: 'data:image/webp;base64,a2VlcA==',
			},
			new Set(['keep']),
		);

		await expect(
			saveImageAssets({}, new Set(['keep'])),
		).resolves.toBeUndefined();
		await expect(loadImageAssets(['keep'])).resolves.toEqual({
			keep: 'data:image/webp;base64,a2VlcA==',
		});
	});

	it('returns an empty map when no asset ids are requested', async () => {
		await expect(loadImageAssets([])).resolves.toEqual({});
	});

	it('stores percent-encoded data URLs and rejects invalid ones', async () => {
		await saveImageAssets(
			{
				plain: 'data:image/webp,hello%20webp',
			},
			new Set(['plain']),
		);

		await expect(loadImageAssets(['plain'])).resolves.toEqual({
			plain: 'data:image/webp;base64,aGVsbG8gd2VicA==',
		});
		await expect(
			saveImageAssets({ bad: 'not-a-data-url' }, new Set(['bad'])),
		).rejects.toThrow('Image asset is not a data URL');
	});

	it('does nothing when every stored asset is still referenced', async () => {
		await saveImageAssets(
			{
				keep: 'data:image/webp;base64,a2VlcA==',
			},
			new Set(['keep']),
		);

		await expect(
			deleteImageAssetsExcept(new Set(['keep'])),
		).resolves.toBeUndefined();
		await expect(loadImageAssets(['keep'])).resolves.toEqual({
			keep: 'data:image/webp;base64,a2VlcA==',
		});
	});
});

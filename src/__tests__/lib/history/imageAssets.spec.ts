import { describe, expect, it } from 'vitest';
import {
	collectAssetIdsFromHistory,
	createImageAssetStore,
} from '@/lib/history/imageAssets';
import type { HistoryDocumentJSON } from '@/types/history';

const documentWithAssets = (
	...assetIds: string[]
): HistoryDocumentJSON => {
	return {
		title: 'Demo',
		activePageId: 'page-1',
		pages: [
			{
				id: 'page-1',
				name: 'Page 1',
				width: 100,
				height: 100,
				activeLayerId: 'layer-1',
				layers: [
					{
						id: 'layer-1',
						name: 'Layer 1',
						visible: true,
						shapes: assetIds.map((assetId, index) => {
							return {
								id: `shape-${index}`,
								points: [],
								strokeWidth: 1,
								image: {
									assetId,
									left: 0,
									top: 0,
									scaleX: 1,
									scaleY: 1,
									originX: 'center',
									originY: 'center',
									width: 1,
									height: 1,
								},
							};
						}),
						texts: [],
						gridCols: 2,
						gridRows: 2,
						marginTop: 0,
						marginRight: 0,
						marginBottom: 0,
						marginLeft: 0,
						strokeWidth: 1,
					},
				],
			},
		],
	};
};

describe('imageAssets', () => {
	it('interns the same source to a single id', () => {
		const assets = createImageAssetStore();
		const first = assets.intern('data:image/png;base64,aa');
		const second = assets.intern('data:image/png;base64,aa');
		const third = assets.intern('data:image/png;base64,bb');

		expect(first).toBe(second);
		expect(third).not.toBe(first);
		expect(assets.resolve(first)).toBe('data:image/png;base64,aa');
		expect(Object.keys(assets.exportAll())).toHaveLength(2);
	});

	it('drops unused assets on retain', () => {
		const assets = createImageAssetStore();
		const keep = assets.intern('keep');
		const drop = assets.intern('drop');

		assets.retain([keep]);

		expect(assets.resolve(keep)).toBe('keep');
		expect(() => {
			assets.resolve(drop);
		}).toThrow(/Missing image asset/);
	});

	it('collects asset ids from patch values, not only from the document', () => {
		const ids = collectAssetIdsFromHistory({
			baseline: documentWithAssets(),
			entries: [
				{
					id: 'step',
					label: 'Place image',
					patches: [
						{
							op: 'replace',
							path: [
								'pages',
								0,
								'layers',
								0,
								'shapes',
								0,
								'image',
								'assetId',
							],
							value: 'asset-from-patch',
						},
					],
					inversePatches: [
						{
							op: 'replace',
							path: ['pages', 0, 'layers', 0, 'shapes', 0, 'image'],
							value: {
								assetId: 'asset-from-inverse',
								left: 0,
								top: 0,
							},
						},
					],
				},
			],
		});

		expect(ids.has('asset-from-patch')).toBe(true);
		expect(ids.has('asset-from-inverse')).toBe(true);
	});

	it('hydrates a persisted image map', () => {
		const assets = createImageAssetStore();

		assets.hydrate({
			'asset-1': 'data:image/png;base64,aa',
		});

		expect(assets.resolve('asset-1')).toBe('data:image/png;base64,aa');
		expect(assets.intern('data:image/png;base64,aa')).toBe('asset-1');
	});
});

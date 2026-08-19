import { describe, expect, it, vi } from 'vitest';
import { HISTORY_LABEL, historyLabelForPage } from '@/lib/history/historyEnums';
import { captureDocument } from '@/lib/history/documentSnapshot';
import { createImageAssetStore } from '@/lib/history/imageAssets';
import {
	createHistoryState,
	pushMovement,
	toPersistedHistory,
} from '@/lib/history/historyStack';
import {
	PROJECT_STORAGE_KEY,
	loadPersistedProject,
	persistProject,
} from '@/lib/history/projectStorage';
import { Page } from '@/models/Page';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import type { HistoryStackState } from '@/types/history';

const assets = createImageAssetStore();

const documentOf = (page: Page, title = 'Saved') => {
	return captureDocument({
		title,
		activePageId: page.id,
		pages: [page],
		intern: assets.intern,
	});
};

describe('projectStorage', () => {
	it('round-trips a persisted project', () => {
		const page = Page.createBlank(1);
		const start = documentOf(page);

		page.name = 'Cover';

		const document = documentOf(page);
		const history = pushMovement(
			createHistoryState(start),
			historyLabelForPage(HISTORY_LABEL.RenamePage, 'Cover'),
			document,
		);

		persistProject({
			version: 2,
			document,
			images: assets.exportAll(),
			history: toPersistedHistory(history),
		});

		const loaded = loadPersistedProject();

		expect(localStorage.getItem(PROJECT_STORAGE_KEY)).toBeTruthy();
		expect(loaded?.version).toBe(2);
		expect(loaded?.document.title).toBe('Saved');
		expect(loaded?.history.index).toBe(history.index);
		expect(loaded?.history.entries).toHaveLength(history.entries.length);
	});

	it('returns null for missing, corrupt or invalid storage', () => {
		expect(loadPersistedProject()).toBeNull();

		localStorage.setItem(PROJECT_STORAGE_KEY, '{not-json');
		expect(loadPersistedProject()).toBeNull();

		localStorage.setItem(
			PROJECT_STORAGE_KEY,
			JSON.stringify({
				version: 3,
				document: { title: 'x', activePageId: 'a', pages: [{}] },
				images: {},
				history: { entries: [], index: 0 },
			}),
		);
		expect(loadPersistedProject()).toBeNull();

		localStorage.setItem(
			PROJECT_STORAGE_KEY,
			JSON.stringify({
				version: 2,
				document: { title: 'x', activePageId: 'a', pages: [] },
				images: {},
				history: { entries: [], index: -1 },
			}),
		);
		expect(loadPersistedProject()).toBeNull();
	});

	it('migrates a v1 project with embedded image sources', () => {
		const page = Page.createBlank(1);
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 6, y: 0 },
				{ x: 6, y: 6 },
			],
			2,
		);

		shape.setImage(
			new ShapeImage({
				src: 'data:image/png;base64,legacy',
				left: 0,
				top: 0,
				scaleX: 1,
				scaleY: 1,
			}),
		);
		page.addShape(shape);

		localStorage.setItem(
			PROJECT_STORAGE_KEY,
			JSON.stringify({
				version: 1,
				document: {
					title: 'Old',
					activePageId: page.id,
					pages: [
						{
							id: page.id,
							name: page.name,
							width: page.width,
							height: page.height,
							activeLayerId: page.activeLayerId,
							layers: [
								{
									id: page.layers[0]?.id,
									name: page.layers[0]?.name,
									visible: true,
									shapes: [
										{
											id: shape.id,
											points: shape.points,
											strokeWidth: 2,
											image: shape.image?.toJSON(),
										},
									],
									texts: [],
									gridCols: page.layers[0]?.gridCols,
									gridRows: page.layers[0]?.gridRows,
									marginTop: page.layers[0]?.marginTop,
									marginRight: page.layers[0]?.marginRight,
									marginBottom: page.layers[0]?.marginBottom,
									marginLeft: page.layers[0]?.marginLeft,
									strokeWidth: page.layers[0]?.strokeWidth,
								},
							],
						},
					],
				},
				history: {
					index: 0,
					entries: [
						{
							id: 'start',
							label: HISTORY_LABEL.Start,
							snapshot: {
								title: 'Old',
								activePageId: page.id,
								pages: [
									{
										id: page.id,
										name: page.name,
										width: page.width,
										height: page.height,
										activeLayerId: page.activeLayerId,
										layers: page.layers.map((layer) => {
											return {
												id: layer.id,
												name: layer.name,
												visible: layer.visible,
												shapes: layer.shapes.map((item) => {
													return {
														id: item.id,
														points: item.points,
														strokeWidth: item.strokeWidth,
														image: item.image?.toJSON() ?? null,
													};
												}),
												texts: [],
												gridCols: layer.gridCols,
												gridRows: layer.gridRows,
												marginTop: layer.marginTop,
												marginRight: layer.marginRight,
												marginBottom: layer.marginBottom,
												marginLeft: layer.marginLeft,
												strokeWidth: layer.strokeWidth,
											};
										}),
									},
								],
							},
						},
					],
				},
			}),
		);

		const loaded = loadPersistedProject();

		expect(loaded?.version).toBe(2);
		expect(loaded?.document.pages[0]?.layers[0]?.shapes[0]?.image?.src).toBeUndefined();
		expect(
			Object.values(loaded?.images ?? {}),
		).toContain('data:image/png;base64,legacy');
	});

	it('drops the oldest movements when a write exceeds quota', () => {
		const page = Page.createBlank(1);
		let history: HistoryStackState = createHistoryState(documentOf(page));

		for (let index = 0; index < 4; index += 1) {
			page.name = `Page ${index + 2}`;
			history = pushMovement(
				history,
				historyLabelForPage(HISTORY_LABEL.RenamePage, page.name),
				documentOf(page),
			);
		}

		const originalSetItem = Storage.prototype.setItem;
		const write = vi
			.spyOn(Storage.prototype, 'setItem')
			.mockImplementation(function setItem(this: Storage, key, value) {
				if (key === PROJECT_STORAGE_KEY) {
					const parsed: { history?: { entries?: unknown[] } } = JSON.parse(
						String(value),
					);

					if ((parsed.history?.entries?.length ?? 0) > 3) {
						throw new DOMException('quota', 'QuotaExceededError');
					}
				}

				originalSetItem.call(this, key, value);
			});

		try {
			persistProject({
				version: 2,
				document: documentOf(page),
				images: assets.exportAll(),
				history: toPersistedHistory(history),
			});
		} finally {
			write.mockRestore();
		}

		const loaded = loadPersistedProject();

		expect(loaded?.history.entries.length).toBeLessThanOrEqual(3);
		expect(loaded?.document.pages[0]?.name).toBe('Page 5');
	});

	it('does not throw when even the fallback write fails', () => {
		const page = Page.createBlank(1);
		const document = documentOf(page);
		const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('quota', 'QuotaExceededError');
		});

		expect(() => {
			persistProject({
				version: 2,
				document,
				images: {},
				history: toPersistedHistory(createHistoryState(document)),
			});
		}).not.toThrow();

		write.mockRestore();
		expect(loadPersistedProject()).toBeNull();
	});
});

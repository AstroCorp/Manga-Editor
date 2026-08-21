import { describe, expect, it, vi } from 'vitest';
import { captureDocument } from '@/lib/history/documentSnapshot';
import { HISTORY_LABEL, historyLabelForPage } from '@/lib/history/historyEnums';
import { createImageAssetStore } from '@/lib/history/imageAssets';
import {
	createHistoryState,
	pushMovement,
	toPersistedHistory,
} from '@/lib/history/historyStack';
import {
	loadImageAssets,
} from '@/lib/history/imageAssetDb';
import {
	PROJECT_STORAGE_KEY,
	loadPersistedProject,
	persistProject,
} from '@/lib/history/projectStorage';
import { Page } from '@/models/Page';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import type {
	HistoryStackState,
	PersistedHistoryStack,
} from '@/types/history';

const documentOf = (
	page: Page,
	assets: ReturnType<typeof createImageAssetStore>,
	title = 'Saved',
) => {
	return captureDocument({
		title,
		activePageId: page.id,
		pages: [page],
		intern: assets.intern,
	});
};

describe('projectStorage', () => {
	it('stores image bytes in IndexedDB and only metadata in localStorage', async () => {
		const assets = createImageAssetStore();
		const page = Page.createBlank(1);
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			2,
		);

		shape.setImage(
			new ShapeImage({
				src: 'data:image/webp;base64,d2VicA==',
				left: 0,
				top: 0,
				scaleX: 1,
				scaleY: 1,
			}),
		);
		page.addShape(shape);

		const document = documentOf(page, assets);
		const history = toPersistedHistory(createHistoryState(document));
		const stored = await persistProject({
			version: 3,
			document,
			images: assets.exportAll(),
			history,
		});
		const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
		const loaded = await loadPersistedProject();

		expect(stored).toEqual(history);
		expect(raw).toBeTruthy();
		expect(raw).not.toContain('data:image');
		expect(loaded?.version).toBe(3);
		expect(loaded?.document).toEqual(document);
		expect(Object.values(loaded?.images ?? {})).toEqual([
			'data:image/webp;base64,d2VicA==',
		]);
	});

	it('returns null for missing, corrupt, old or invalid metadata', async () => {
		expect(await loadPersistedProject()).toBeNull();

		localStorage.setItem(PROJECT_STORAGE_KEY, '{not-json');
		expect(await loadPersistedProject()).toBeNull();

		localStorage.setItem(
			PROJECT_STORAGE_KEY,
			JSON.stringify({
				version: 2,
				document: { title: 'Old', activePageId: 'a', pages: [{}] },
				images: {},
				history: { entries: [], index: 0 },
			}),
		);
		expect(await loadPersistedProject()).toBeNull();

		localStorage.setItem(
			PROJECT_STORAGE_KEY,
			JSON.stringify({
				version: 3,
				document: { title: 'x', activePageId: 'a', pages: [] },
				history: { entries: [], index: -1 },
			}),
		);
		expect(await loadPersistedProject()).toBeNull();
	});

	it('drops the oldest movements by bisection when metadata exceeds quota', async () => {
		const assets = createImageAssetStore();
		const page = Page.createBlank(1);
		let history: HistoryStackState = createHistoryState(
			documentOf(page, assets),
		);

		for (let index = 0; index < 4; index += 1) {
			page.name = `Page ${index + 2}`;
			history = pushMovement(
				history,
				historyLabelForPage(HISTORY_LABEL.RenamePage, page.name),
				documentOf(page, assets),
			);
		}

		const originalSetItem = Storage.prototype.setItem;
		let attempts = 0;
		const write = vi
			.spyOn(Storage.prototype, 'setItem')
			.mockImplementation(function setItem(this: Storage, key, value) {
				attempts += 1;

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
		let stored: PersistedHistoryStack | null = null;

		try {
			stored = await persistProject({
				version: 3,
				document: documentOf(page, assets),
				images: assets.exportAll(),
				history: toPersistedHistory(history),
			});
		} finally {
			write.mockRestore();
		}

		const loaded = await loadPersistedProject();

		expect(stored?.entries).toHaveLength(3);
		expect(loaded?.history.entries).toHaveLength(3);
		expect(attempts).toBeLessThanOrEqual(5);
	});

	it('does not commit metadata when a referenced source is missing', async () => {
		const assets = createImageAssetStore();
		const page = Page.createBlank(1);
		const document = documentOf(page, assets);
		const history = toPersistedHistory(createHistoryState(document));

		history.baseline.pages[0]!.layers[0]!.shapes.push({
			id: 'missing-shape',
			points: [],
			strokeWidth: 1,
			image: {
				assetId: 'missing',
				left: 0,
				top: 0,
				scaleX: 1,
				scaleY: 1,
				width: 1,
				height: 1,
			},
		});

		expect(
			await persistProject({
				version: 3,
				document: history.baseline,
				images: {},
				history,
			}),
		).toBeNull();
		expect(localStorage.getItem(PROJECT_STORAGE_KEY)).toBeNull();
	});

	it('does not throw when even the fallback metadata write fails', async () => {
		const assets = createImageAssetStore();
		const page = Page.createBlank(1);
		const document = documentOf(page, assets);
		const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('quota', 'QuotaExceededError');
		});

		await expect(
			persistProject({
				version: 3,
				document,
				images: assets.exportAll(),
				history: toPersistedHistory(createHistoryState(document)),
			}),
		).resolves.toBeNull();

		write.mockRestore();
		expect(await loadPersistedProject()).toBeNull();
	});

	it('prunes orphan image assets after a successful save', async () => {
		const assets = createImageAssetStore();
		const page = Page.createBlank(1);
		const keep = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 8, y: 0 },
				{ x: 8, y: 8 },
			],
			2,
		);
		const drop = Shape.create(
			[
				{ x: 10, y: 0 },
				{ x: 18, y: 0 },
				{ x: 18, y: 8 },
			],
			2,
		);

		keep.setImage(
			new ShapeImage({
				src: 'data:image/webp;base64,a2VlcA==',
				left: 0,
				top: 0,
				scaleX: 1,
				scaleY: 1,
			}),
		);
		drop.setImage(
			new ShapeImage({
				src: 'data:image/webp;base64,ZHJvcA==',
				left: 0,
				top: 0,
				scaleX: 1,
				scaleY: 1,
			}),
		);
		page.addShape(keep);
		page.addShape(drop);

		const withBoth = documentOf(page, assets);

		await persistProject({
			version: 3,
			document: withBoth,
			images: assets.exportAll(),
			history: toPersistedHistory(createHistoryState(withBoth)),
		});

		page.removeShape(drop.id);

		const withKeep = documentOf(page, assets);

		await persistProject({
			version: 3,
			document: withKeep,
			images: assets.exportAll(),
			history: toPersistedHistory(createHistoryState(withKeep)),
		});

		const dropId = withBoth.pages[0]?.layers[0]?.shapes[1]?.image?.assetId;

		expect(dropId).toBeTruthy();
		await expect(loadImageAssets([dropId!])).rejects.toThrow(
			`Missing image asset: ${dropId}`,
		);
	});
});

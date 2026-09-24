import { describe, expect, it, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { HISTORY_LABEL, historyLabelForPage } from '@/lib/history/historyEnums';
import { deleteImageAssetDatabase } from '@/lib/history/imageAssetDb';
import {
	PROJECT_STORAGE_KEY,
	loadPersistedProject,
} from '@/lib/history/projectStorage';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import { TextBlock } from '@/models/TextBlock';
import { useHistoryStore } from '@/stores/history';
import { useMangaStore } from '@/stores/manga';

const panel = () => {
	return Shape.create(
		[
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 10, y: 10 },
		],
		3,
	);
};

describe('manga history', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('records content mutations and undoes them', () => {
		const mangaStore = useMangaStore();
		const historyStore = useHistoryStore();
		const shape = panel();

		mangaStore.addShape(shape);

		expect(historyStore.entries.map((entry) => entry.label)).toEqual([
			HISTORY_LABEL.Start,
			historyLabelForPage(HISTORY_LABEL.AddPanel, 'Page 1'),
		]);
		expect(mangaStore.shapes).toHaveLength(1);

		mangaStore.undoHistory();

		expect(mangaStore.shapes).toHaveLength(0);
		expect(historyStore.canRedo).toBe(true);

		mangaStore.redoHistory();

		expect(mangaStore.shapes).toHaveLength(1);
		expect(mangaStore.shapes[0]?.id).toBe(shape.id);
	});

	it('does not record updateText until recordHistory is called', () => {
		const mangaStore = useMangaStore();
		const historyStore = useHistoryStore();
		const text = TextBlock.create(4, 5);

		mangaStore.addText(text);

		const afterAdd = historyStore.entries.length;

		const originalContent = text.content;

		mangaStore.updateText(text.id, { content: 'Typing' });
		mangaStore.updateText(text.id, { content: 'Typing more' });

		expect(historyStore.entries).toHaveLength(afterAdd);
		expect(mangaStore.texts[0]?.content).toBe('Typing more');

		mangaStore.recordHistory(HISTORY_LABEL.EditText);

		expect(historyStore.entries.at(-1)?.label).toBe(
			historyLabelForPage(HISTORY_LABEL.EditText, 'Page 1'),
		);

		mangaStore.undoHistory();

		expect(mangaStore.texts[0]?.content).toBe(originalContent);
	});

	it('discards future movements when a new change happens after undo', () => {
		const mangaStore = useMangaStore();
		const historyStore = useHistoryStore();

		mangaStore.addShape(panel());
		mangaStore.addText(TextBlock.create(1, 1));
		mangaStore.undoHistory();
		mangaStore.addLayer();

		expect(historyStore.entries.map((entry) => entry.label)).toEqual([
			HISTORY_LABEL.Start,
			historyLabelForPage(HISTORY_LABEL.AddPanel, 'Page 1'),
			historyLabelForPage(HISTORY_LABEL.AddLayer, 'Page 1'),
		]);
		expect(historyStore.canRedo).toBe(false);
		expect(mangaStore.texts).toHaveLength(0);
		expect(mangaStore.layers).toHaveLength(2);
	});

	it('jumps to a past movement and restores that snapshot', () => {
		const mangaStore = useMangaStore();
		const historyStore = useHistoryStore();

		mangaStore.addShape(panel());
		mangaStore.addPage();

		const startId = historyStore.entries[0]!.id;

		mangaStore.jumpToHistory(startId);

		expect(mangaStore.pages).toHaveLength(1);
		expect(mangaStore.shapes).toHaveLength(0);
		expect(historyStore.currentLabel).toBe(HISTORY_LABEL.Start);
	});

	it('does not record selectPage as a movement', () => {
		const mangaStore = useMangaStore();
		const historyStore = useHistoryStore();
		const firstId = mangaStore.activePageId;

		mangaStore.addPage();

		const afterAdd = historyStore.entries.length;

		mangaStore.selectPage(firstId);

		expect(historyStore.entries).toHaveLength(afterAdd);
		expect(mangaStore.activePageId).toBe(firstId);
	});

	it('names movements with the page and restores them from localStorage', async () => {
		const mangaStore = useMangaStore();
		const historyStore = useHistoryStore();

		mangaStore.addShape(panel());
		mangaStore.addPage();

		expect(historyStore.entries.at(-1)?.label).toBe(
			historyLabelForPage(HISTORY_LABEL.AddPage, 'Page 2'),
		);
		await mangaStore.waitForPersistence();

		const pinia = createPinia();

		setActivePinia(pinia);

		const restoredManga = useMangaStore();
		const restoredHistory = useHistoryStore();

		await restoredManga.initialize();

		expect(restoredManga.pages).toHaveLength(2);
		expect(restoredManga.activePage.name).toBe('Page 2');
		expect(restoredHistory.entries.map((entry) => entry.label)).toEqual([
			HISTORY_LABEL.Start,
			historyLabelForPage(HISTORY_LABEL.AddPanel, 'Page 1'),
			historyLabelForPage(HISTORY_LABEL.AddPage, 'Page 2'),
		]);
		expect(restoredHistory.canUndo).toBe(true);
	});

	it('records rotate and scale image as distinct movements', async () => {
		const mangaStore = useMangaStore();
		const historyStore = useHistoryStore();
		const shape = panel();

		mangaStore.addShape(shape);
		mangaStore.setShapeImage(
			shape.id,
			new ShapeImage({
				src: 'data:image/png;base64,eHg=',
				left: 10,
				top: 10,
				scaleX: 1,
				scaleY: 1,
			}),
		);
		mangaStore.setShapeImage(
			shape.id,
			new ShapeImage({
				src: 'data:image/png;base64,eHg=',
				left: 10,
				top: 10,
				scaleX: 1,
				scaleY: 1,
				angle: 45,
			}),
		);
		mangaStore.setShapeImage(
			shape.id,
			new ShapeImage({
				src: 'data:image/png;base64,eHg=',
				left: 10,
				top: 10,
				scaleX: 1.5,
				scaleY: 1.5,
				angle: 45,
			}),
		);

		expect(historyStore.entries.map((entry) => entry.label).slice(-3)).toEqual([
			historyLabelForPage(HISTORY_LABEL.PlaceImage, 'Page 1'),
			historyLabelForPage(HISTORY_LABEL.RotateImage, 'Page 1'),
			historyLabelForPage(HISTORY_LABEL.ScaleImage, 'Page 1'),
		]);

		await mangaStore.waitForPersistence();

		const raw = localStorage.getItem(PROJECT_STORAGE_KEY)!;
		const persisted = JSON.parse(raw) as {
			history: { entries: unknown[] };
		};
		const loaded = await loadPersistedProject();

		expect(raw).not.toContain('data:image');
		expect(Object.values(loaded?.images ?? {})).toEqual([
			'data:image/png;base64,eHg=',
		]);
		expect(JSON.stringify(persisted.history.entries)).not.toContain(
			'data:image/png;base64,eHg=',
		);
	});

	it('undoes and redoes a placed image without losing the source', () => {
		const mangaStore = useMangaStore();
		const src = 'data:image/png;base64,xx';
		const shape = panel();

		mangaStore.addShape(shape);
		mangaStore.setShapeImage(
			shape.id,
			new ShapeImage({
				src,
				left: 10,
				top: 10,
				scaleX: 1,
				scaleY: 1,
			}),
		);

		mangaStore.undoHistory();

		expect(mangaStore.shapes[0]?.image).toBeNull();

		mangaStore.redoHistory();

		expect(mangaStore.shapes[0]?.image?.src).toBe(src);
	});

	it('reloads an undone document and can still redo', async () => {
		const mangaStore = useMangaStore();
		const shape = panel();

		mangaStore.addShape(shape);
		mangaStore.undoHistory();
		await mangaStore.waitForPersistence();

		setActivePinia(createPinia());

		const restoredManga = useMangaStore();
		const restoredHistory = useHistoryStore();

		await restoredManga.initialize();

		expect(restoredManga.shapes).toHaveLength(0);
		expect(restoredHistory.canRedo).toBe(true);

		restoredManga.redoHistory();

		expect(restoredManga.shapes).toHaveLength(1);
		expect(restoredManga.shapes[0]?.id).toBe(shape.id);
	});

	it('records move, flip and grayscale image as distinct movements', () => {
		const mangaStore = useMangaStore();
		const historyStore = useHistoryStore();
		const shape = panel();

		mangaStore.addShape(shape);
		mangaStore.setShapeImage(
			shape.id,
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 10,
				top: 10,
				scaleX: 1,
				scaleY: 1,
			}),
		);
		mangaStore.setShapeImage(
			shape.id,
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 18,
				top: 12,
				scaleX: 1,
				scaleY: 1,
			}),
		);
		mangaStore.setShapeImage(
			shape.id,
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 18,
				top: 12,
				scaleX: 1,
				scaleY: 1,
				flipX: true,
			}),
		);
		mangaStore.setShapeImage(
			shape.id,
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 18,
				top: 12,
				scaleX: 1,
				scaleY: 1,
				flipX: true,
				grayscale: true,
			}),
		);

		expect(historyStore.entries.map((entry) => entry.label).slice(-3)).toEqual([
			historyLabelForPage(HISTORY_LABEL.MoveImage, 'Page 1'),
			historyLabelForPage(HISTORY_LABEL.FlipImage, 'Page 1'),
			historyLabelForPage(HISTORY_LABEL.GrayscaleImage, 'Page 1'),
		]);
	});

	it('labels delete page with the removed name and reorder without a page', () => {
		const mangaStore = useMangaStore();
		const historyStore = useHistoryStore();

		mangaStore.addPage();
		mangaStore.renamePage(mangaStore.pages[1]!.id, 'Cover');
		mangaStore.reorderPages(1, 0);

		expect(historyStore.entries.at(-1)?.label).toBe(HISTORY_LABEL.ReorderPages);

		mangaStore.removePage(
			mangaStore.pages.find((page) => {
				return page.name === 'Cover';
			})!.id,
		);

		expect(historyStore.entries.at(-1)?.label).toBe(
			historyLabelForPage(HISTORY_LABEL.DeletePage, 'Cover'),
		);
	});

	it('persists the selected page without adding a movement', async () => {
		const mangaStore = useMangaStore();
		const historyStore = useHistoryStore();
		const firstId = mangaStore.activePageId;

		mangaStore.addPage();
		mangaStore.selectPage(firstId);
		await mangaStore.waitForPersistence();

		const afterSelect = historyStore.entries.length;
		const pinia = createPinia();

		setActivePinia(pinia);

		const restored = useMangaStore();

		await restored.initialize();

		expect(restored.activePageId).toBe(firstId);
		expect(useHistoryStore().entries).toHaveLength(afterSelect);
	});

	it('falls back to a blank document when persisted pages cannot be restored', async () => {
		const mangaStore = useMangaStore();
		const shape = panel();

		mangaStore.addShape(shape);
		mangaStore.setShapeImage(
			shape.id,
			new ShapeImage({
				src: 'data:image/webp;base64,d2VicA==',
				left: 0,
				top: 0,
				scaleX: 1,
				scaleY: 1,
			}),
		);
		await mangaStore.waitForPersistence();
		await deleteImageAssetDatabase();

		setActivePinia(createPinia());

		const restored = useMangaStore();

		await restored.initialize();

		expect(restored.pages).toHaveLength(1);
		expect(restored.shapes).toHaveLength(0);
		expect(restored.activePage.name).toBe('Page 1');
		expect(useHistoryStore().currentLabel).toBe(HISTORY_LABEL.Start);
	});

	it('coalesces rapid writes into the latest persisted state', async () => {
		const mangaStore = useMangaStore();

		mangaStore.addPage();
		mangaStore.addPage();
		await mangaStore.waitForPersistence();

		setActivePinia(createPinia());

		const restored = useMangaStore();

		await restored.initialize();

		expect(restored.pages).toHaveLength(3);
		expect(restored.activePage.name).toBe('Page 3');
	});

	it('initializes only once and marks the store as hydrated', async () => {
		const mangaStore = useMangaStore();

		await Promise.all([mangaStore.initialize(), mangaStore.initialize()]);

		expect(mangaStore.isHydrated).toBe(true);
		await expect(mangaStore.initialize()).resolves.toBeUndefined();
		expect(mangaStore.isHydrated).toBe(true);
	});

	it('resetProject clears history and interned images', async () => {
		const mangaStore = useMangaStore();
		const historyStore = useHistoryStore();
		const shape = panel();

		mangaStore.addShape(shape);
		mangaStore.setShapeImage(
			shape.id,
			new ShapeImage({
				src: 'data:image/png;base64,eHg=',
				left: 10,
				top: 10,
				scaleX: 1,
				scaleY: 1,
			}),
		);
		mangaStore.addPage();

		expect(Object.values(historyStore.exportImages())).toEqual([
			'data:image/png;base64,eHg=',
		]);

		mangaStore.resetProject();
		await mangaStore.waitForPersistence();

		expect(historyStore.entries.map((entry) => entry.label)).toEqual([
			HISTORY_LABEL.Start,
		]);
		expect(historyStore.canUndo).toBe(false);
		expect(historyStore.exportImages()).toEqual({});

		const loaded = await loadPersistedProject();

		expect(loaded?.document.pages).toHaveLength(1);
		expect(loaded?.history.entries).toHaveLength(1);
		expect(loaded?.images).toEqual({});
	});

	it('does nothing when undo, redo or jump cannot move', () => {
		const mangaStore = useMangaStore();
		const historyStore = useHistoryStore();
		const pageId = mangaStore.activePageId;

		mangaStore.undoHistory();
		mangaStore.redoHistory();
		mangaStore.jumpToHistory(historyStore.entries[0]!.id);
		mangaStore.jumpToHistory('missing');

		expect(mangaStore.activePageId).toBe(pageId);
		expect(historyStore.entries).toHaveLength(1);
	});

	it('uses the first page when the persisted activePageId is missing', async () => {
		const mangaStore = useMangaStore();

		mangaStore.addPage();
		await mangaStore.waitForPersistence();

		const raw = localStorage.getItem(PROJECT_STORAGE_KEY);

		expect(raw).toBeTruthy();

		const parsed = JSON.parse(raw!) as {
			document: { activePageId: string };
		};

		parsed.document.activePageId = 'missing-page';
		localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(parsed));

		setActivePinia(createPinia());

		const restored = useMangaStore();

		await restored.initialize();

		expect(restored.pages).toHaveLength(2);
		expect(restored.activePageId).toBe(restored.pages[0]?.id);
	});
});

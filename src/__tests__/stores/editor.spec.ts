import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { DEFAULT_ZOOM_PERCENT } from '@/lib/zoom';
import { EXPORT_IMAGE_FORMAT } from '@/lib/editor/editorEnums';
import { zipDataUrls } from '@/lib/export/zipDataUrls';
import { exportPageToDataUrl } from '@/lib/fabric/exportPageToDataUrl';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';
import * as download from '@/lib/download';

vi.mock('@/lib/fabric/exportPageToDataUrl', () => {
	return {
		exportPageToDataUrl: vi.fn(async () => 'data:image/png;base64,abc'),
	};
});

vi.mock('@/lib/export/zipDataUrls', () => {
	return {
		zipDataUrls: vi.fn(async () => new Blob(['zip'])),
	};
});

vi.mock('vue3-toastify', () => {
	return {
		toast: {
			warn: vi.fn(),
			error: vi.fn(),
		},
	};
});

const registerExportCanvas = (
	store: ReturnType<typeof useEditorStore>,
	exportDataUrl = vi.fn(() => 'data:image/png;base64,abc'),
) => {
	const cancelStroke = vi.fn();

	store.registerCanvas({
		cancelStroke,
		exportDataUrl,
		resetZoomView: vi.fn(),
		syncCanvasOffset: vi.fn(),
		addSimpleText: vi.fn(),
		addBoxedText: vi.fn(),
		addRoundedBoxedText: vi.fn(),
		focusLayerElement: vi.fn(),
		deleteLayerElement: vi.fn(),
	});

	return { cancelStroke, exportDataUrl };
};

describe('useEditorStore selection and zoom bridge', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
	});

	it('starts at default zoom', () => {
		const store = useEditorStore();

		expect(store.zoomPercent).toBe(DEFAULT_ZOOM_PERCENT);
	});

	it('registerCanvas wires cancelStroke and zoom actions', () => {
		const store = useEditorStore();
		const cancelStroke = vi.fn();
		const exportDataUrl = vi.fn(() => 'data:image/png;base64,abc');
		const resetZoomView = vi.fn();
		const addSimpleText = vi.fn();
		const addBoxedText = vi.fn();
		const addRoundedBoxedText = vi.fn();
		const focusLayerElement = vi.fn();
		const deleteLayerElement = vi.fn();

		store.registerCanvas({
			cancelStroke,
			exportDataUrl,
			resetZoomView,
			syncCanvasOffset: vi.fn(),
			addSimpleText,
			addBoxedText,
			addRoundedBoxedText,
			focusLayerElement,
			deleteLayerElement,
		});

		store.cancelStroke();
		expect(cancelStroke).toHaveBeenCalledOnce();

		store.addSimpleText();
		expect(addSimpleText).toHaveBeenCalledOnce();

		store.addBoxedText();
		expect(addBoxedText).toHaveBeenCalledOnce();

		store.addRoundedBoxedText();
		expect(addRoundedBoxedText).toHaveBeenCalledOnce();

		store.focusLayerElement({
			layerId: 'layer-1',
			kind: 'shape',
			id: 'shape-1',
		});
		expect(focusLayerElement).toHaveBeenCalledExactlyOnceWith({
			layerId: 'layer-1',
			kind: 'shape',
			id: 'shape-1',
		});

		store.deleteLayerElement({
			layerId: 'layer-1',
			kind: 'text',
			id: 'text-1',
		});
		expect(deleteLayerElement).toHaveBeenCalledExactlyOnceWith({
			layerId: 'layer-1',
			kind: 'text',
			id: 'text-1',
		});

		store.resetZoom();

		expect(store.zoomPercent).toBe(DEFAULT_ZOOM_PERCENT);
		expect(resetZoomView).toHaveBeenCalledOnce();
	});

	it('unregisterCanvas stubs actions', () => {
		const store = useEditorStore();
		const cancelStroke = vi.fn();
		const addSimpleText = vi.fn();

		store.registerCanvas({
			cancelStroke,
			exportDataUrl: vi.fn(() => null),
			resetZoomView: vi.fn(),
			syncCanvasOffset: vi.fn(),
			addSimpleText,
			addBoxedText: vi.fn(),
			addRoundedBoxedText: vi.fn(),
			focusLayerElement: vi.fn(),
			deleteLayerElement: vi.fn(),
		});

		store.unregisterCanvas();
		store.cancelStroke();
		store.addSimpleText();
		store.addRoundedBoxedText();

		expect(cancelStroke).not.toHaveBeenCalled();
		expect(addSimpleText).not.toHaveBeenCalled();
	});

	it('exportPage cancels stroke then downloads the image', () => {
		const store = useEditorStore();
		const cancelStroke = vi.fn();
		const exportDataUrl = vi.fn(() => 'data:image/png;base64,abc');
		const click = vi.fn();
		const remove = vi.fn();
		const link = {
			href: '',
			download: '',
			rel: '',
			click,
			remove,
		} as unknown as HTMLAnchorElement;

		vi.spyOn(document, 'createElement').mockReturnValue(link);
		vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
			return node;
		});

		store.registerCanvas({
			cancelStroke,
			exportDataUrl,
			resetZoomView: vi.fn(),
			syncCanvasOffset: vi.fn(),
			addSimpleText: vi.fn(),
			addBoxedText: vi.fn(),
			addRoundedBoxedText: vi.fn(),
			focusLayerElement: vi.fn(),
			deleteLayerElement: vi.fn(),
		});

		store.exportPage(EXPORT_IMAGE_FORMAT.Png);

		expect(cancelStroke).toHaveBeenCalledOnce();
		expect(exportDataUrl).toHaveBeenCalledWith(EXPORT_IMAGE_FORMAT.Png);
		expect(link.download).toBe('untitled-page-1.png');
		expect(click).toHaveBeenCalledOnce();

		store.exportPage(EXPORT_IMAGE_FORMAT.Jpeg);

		expect(exportDataUrl).toHaveBeenCalledWith(EXPORT_IMAGE_FORMAT.Jpeg);
		expect(link.download).toBe('untitled-page-1.jpg');
	});

	it('exportPagesZip zips every page and downloads the archive', async () => {
		const store = useEditorStore();
		const mangaStore = useMangaStore();
		const { cancelStroke } = registerExportCanvas(store);
		const downloadBlob = vi
			.spyOn(download, 'downloadBlob')
			.mockImplementation(() => undefined);

		mangaStore.addPage();

		await store.exportPagesZip(EXPORT_IMAGE_FORMAT.Jpeg);

		expect(cancelStroke).toHaveBeenCalledOnce();
		expect(exportPageToDataUrl).toHaveBeenCalledTimes(2);
		expect(exportPageToDataUrl).toHaveBeenNthCalledWith(
			1,
			mangaStore.pages[0],
			EXPORT_IMAGE_FORMAT.Jpeg,
		);
		expect(exportPageToDataUrl).toHaveBeenNthCalledWith(
			2,
			mangaStore.pages[1],
			EXPORT_IMAGE_FORMAT.Jpeg,
		);
		expect(zipDataUrls).toHaveBeenCalledExactlyOnceWith([
			{
				filename: 'untitled-page-1.jpg',
				dataUrl: 'data:image/png;base64,abc',
			},
			{
				filename: 'untitled-page-2.jpg',
				dataUrl: 'data:image/png;base64,abc',
			},
		]);
		expect(downloadBlob).toHaveBeenCalledExactlyOnceWith(
			expect.any(Blob),
			'untitled-jpg.zip',
		);
	});

	it('exportPagesZip warns if any page has hidden layers', async () => {
		const { toast } = await import('vue3-toastify');
		const store = useEditorStore();
		const mangaStore = useMangaStore();
		const firstPageId = mangaStore.activePage.id;

		registerExportCanvas(store);
		vi.spyOn(download, 'downloadBlob').mockImplementation(() => undefined);

		mangaStore.addPage();
		mangaStore.addLayer();
		mangaStore.setLayerVisible(mangaStore.layers[1]!.id, false);
		mangaStore.selectPage(firstPageId);

		await store.exportPagesZip(EXPORT_IMAGE_FORMAT.Png);

		expect(toast.warn).toHaveBeenCalledExactlyOnceWith(
			'Hidden layers are not included in the export.',
			{ autoClose: 4000 },
		);
	});

	it('exportPagesZip toasts when a page cannot be exported', async () => {
		const { toast } = await import('vue3-toastify');
		const store = useEditorStore();

		registerExportCanvas(store);
		const downloadBlob = vi
			.spyOn(download, 'downloadBlob')
			.mockImplementation(() => undefined);

		vi.mocked(exportPageToDataUrl).mockRejectedValueOnce(
			new Error('hydrate failed'),
		);

		await store.exportPagesZip(EXPORT_IMAGE_FORMAT.Png);

		expect(toast.error).toHaveBeenCalledExactlyOnceWith(
			'Could not export the pages.',
		);
		expect(downloadBlob).not.toHaveBeenCalled();
	});

	it('clamps zoom percent and steps in/out', () => {
		const store = useEditorStore();

		store.setZoomPercent(999);
		expect(store.zoomPercent).toBe(500);

		store.setZoomPercent(1);
		expect(store.zoomPercent).toBe(5);

		store.setZoomPercent(100);
		store.zoomIn();
		expect(store.zoomPercent).toBe(110);
		store.zoomOut();
		expect(store.zoomPercent).toBe(100);
	});
});

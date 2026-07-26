import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { DEFAULT_ZOOM_PERCENT } from '@/lib/zoom';
import { EXPORT_IMAGE_FORMAT } from '@/lib/editor/editorEnums';
import { useEditorStore } from '@/stores/editor';

describe('useEditorStore selection and zoom bridge', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('starts without selected stroke at default zoom', () => {
		const store = useEditorStore();

		expect(store.selectedStrokeWidth).toBeNull();
		expect(store.zoomPercent).toBe(DEFAULT_ZOOM_PERCENT);
	});

	it('registerCanvas wires stroke and zoom actions', () => {
		const store = useEditorStore();
		const cancelStroke = vi.fn();
		const setSelectionStrokeWidth = vi.fn(() => true);
		const exportDataUrl = vi.fn(() => 'data:image/png;base64,abc');
		const resetZoomView = vi.fn();

		store.registerCanvas({
			cancelStroke,
			setSelectionStrokeWidth,
			exportDataUrl,
			resetZoomView,
		});

		store.cancelStroke();
		expect(cancelStroke).toHaveBeenCalledOnce();

		expect(store.setSelectionStrokeWidth(5)).toBe(true);
		expect(setSelectionStrokeWidth).toHaveBeenCalledWith(5);

		store.resetZoom();

		expect(store.zoomPercent).toBe(DEFAULT_ZOOM_PERCENT);
		expect(resetZoomView).toHaveBeenCalledOnce();
	});

	it('unregisterCanvas clears stroke width and stubs actions', () => {
		const store = useEditorStore();
		const setSelectionStrokeWidth = vi.fn(() => true);

		store.registerCanvas({
			cancelStroke: vi.fn(),
			setSelectionStrokeWidth,
			exportDataUrl: vi.fn(() => null),
			resetZoomView: vi.fn(),
		});
		store.setSelectedStrokeWidth(8);

		store.unregisterCanvas();

		expect(store.selectedStrokeWidth).toBeNull();
		expect(store.setSelectionStrokeWidth(3)).toBe(false);
		expect(setSelectionStrokeWidth).not.toHaveBeenCalled();
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
			setSelectionStrokeWidth: vi.fn(() => false),
			exportDataUrl,
			resetZoomView: vi.fn(),
		});

		store.exportPage(EXPORT_IMAGE_FORMAT.Png);

		expect(cancelStroke).toHaveBeenCalledOnce();
		expect(exportDataUrl).toHaveBeenCalledWith(EXPORT_IMAGE_FORMAT.Png);
		expect(link.download).toBe('untitled-page-1.png');
		expect(click).toHaveBeenCalledOnce();
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

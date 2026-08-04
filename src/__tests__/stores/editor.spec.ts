import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { DEFAULT_ZOOM_PERCENT } from '@/lib/zoom';
import { EXPORT_IMAGE_FORMAT } from '@/lib/editor/editorEnums';
import { useEditorStore } from '@/stores/editor';

describe('useEditorStore selection and zoom bridge', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
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

		store.registerCanvas({
			cancelStroke,
			exportDataUrl,
			resetZoomView,
		});

		store.cancelStroke();
		expect(cancelStroke).toHaveBeenCalledOnce();

		store.resetZoom();

		expect(store.zoomPercent).toBe(DEFAULT_ZOOM_PERCENT);
		expect(resetZoomView).toHaveBeenCalledOnce();
	});

	it('unregisterCanvas stubs actions', () => {
		const store = useEditorStore();
		const cancelStroke = vi.fn();

		store.registerCanvas({
			cancelStroke,
			exportDataUrl: vi.fn(() => null),
			resetZoomView: vi.fn(),
		});

		store.unregisterCanvas();
		store.cancelStroke();

		expect(cancelStroke).not.toHaveBeenCalled();
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

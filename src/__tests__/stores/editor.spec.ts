import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { DEFAULT_ZOOM_PERCENT } from '@/lib/zoom';
import { useEditorStore } from '@/stores/editor';

describe('useEditorStore selection and zoom bridge', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('starts without selection at default zoom', () => {
		const store = useEditorStore();

		expect(store.hasSelection).toBe(false);
		expect(store.selectedStrokeWidth).toBeNull();
		expect(store.zoomPercent).toBe(DEFAULT_ZOOM_PERCENT);
	});

	it('registerCanvas wires selection and zoom actions', () => {
		const store = useEditorStore();
		const cancelStroke = vi.fn();
		const removeActive = vi.fn(() => true);
		const setSelectionStrokeWidth = vi.fn(() => true);
		const exportDataUrl = vi.fn(() => 'data:image/png;base64,abc');
		const resetZoomView = vi.fn();

		store.registerCanvas({
			cancelStroke,
			removeActive,
			setSelectionStrokeWidth,
			exportDataUrl,
			resetZoomView,
		});

		store.cancelStroke();
		expect(cancelStroke).toHaveBeenCalledOnce();

		expect(store.removeActive()).toBe(true);
		expect(removeActive).toHaveBeenCalledOnce();

		expect(store.setSelectionStrokeWidth(5)).toBe(true);
		expect(setSelectionStrokeWidth).toHaveBeenCalledWith(5);

		store.resetZoom();

		expect(store.zoomPercent).toBe(DEFAULT_ZOOM_PERCENT);
		expect(resetZoomView).toHaveBeenCalledOnce();
	});

	it('unregisterCanvas clears selection flags and stubs actions', () => {
		const store = useEditorStore();
		const removeActive = vi.fn(() => true);

		store.registerCanvas({
			cancelStroke: vi.fn(),
			removeActive,
			setSelectionStrokeWidth: vi.fn(() => true),
			exportDataUrl: vi.fn(() => null),
			resetZoomView: vi.fn(),
		});
		store.setHasSelection(true);
		store.setSelectedStrokeWidth(8);

		store.unregisterCanvas();

		expect(store.hasSelection).toBe(false);
		expect(store.selectedStrokeWidth).toBeNull();
		expect(store.removeActive()).toBe(false);
		expect(removeActive).not.toHaveBeenCalled();
	});

	it('exportPage downloads when exportDataUrl returns a data url', () => {
		const store = useEditorStore();
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
			cancelStroke: vi.fn(),
			removeActive: vi.fn(() => false),
			setSelectionStrokeWidth: vi.fn(() => false),
			exportDataUrl,
			resetZoomView: vi.fn(),
		});

		store.exportPage('png');

		expect(exportDataUrl).toHaveBeenCalledWith('png');
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

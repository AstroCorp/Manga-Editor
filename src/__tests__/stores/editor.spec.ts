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
		const resetZoomView = vi.fn();

		store.registerCanvas({
			cancelStroke,
			removeActive,
			setSelectionStrokeWidth,
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

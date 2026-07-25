import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useEditorStore } from '@/stores/editor';

describe('useEditorStore selection bridge', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('starts without selection', () => {
		const store = useEditorStore();

		expect(store.hasSelection).toBe(false);
		expect(store.selectedStrokeWidth).toBeNull();
	});

	it('registerCanvas wires selection actions', () => {
		const store = useEditorStore();
		const cancelStroke = vi.fn();
		const removeActive = vi.fn(() => true);
		const setSelectionStrokeWidth = vi.fn(() => true);

		store.registerCanvas({
			cancelStroke,
			removeActive,
			setSelectionStrokeWidth,
		});

		store.cancelStroke();
		
		expect(cancelStroke).toHaveBeenCalledOnce();

		expect(store.removeActive()).toBe(true);
		expect(removeActive).toHaveBeenCalledOnce();

		expect(store.setSelectionStrokeWidth(5)).toBe(true);
		expect(setSelectionStrokeWidth).toHaveBeenCalledWith(5);
	});

	it('unregisterCanvas clears selection flags and stubs actions', () => {
		const store = useEditorStore();
		const removeActive = vi.fn(() => true);

		store.registerCanvas({
			cancelStroke: vi.fn(),
			removeActive,
			setSelectionStrokeWidth: vi.fn(() => true),
		});
		store.setHasSelection(true);
		store.setSelectedStrokeWidth(8);

		store.unregisterCanvas();

		expect(store.hasSelection).toBe(false);
		expect(store.selectedStrokeWidth).toBeNull();
		expect(store.removeActive()).toBe(false);
		expect(removeActive).not.toHaveBeenCalled();
	});
});

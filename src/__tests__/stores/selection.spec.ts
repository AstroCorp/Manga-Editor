import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSelectionStore } from '@/stores/selection';

describe('useSelectionStore', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('tracks focused layer element', () => {
		const store = useSelectionStore();
		const focused = {
			kind: 'shape' as const,
			id: 'shape-1',
			layerId: 'layer-a',
		};

		store.setFocused(focused);
		expect(store.focused).toEqual(focused);

		store.clearFocused();
		expect(store.focused).toBeNull();
	});

	it('queues and consumes pending focus once', () => {
		const store = useSelectionStore();

		store.queuePendingFocus({ kind: 'text', id: 'text-1' });
		expect(store.pendingFocus).toEqual({ kind: 'text', id: 'text-1' });

		expect(store.takePendingFocus()).toEqual({ kind: 'text', id: 'text-1' });
		expect(store.pendingFocus).toBeNull();
		expect(store.takePendingFocus()).toBeNull();
	});

	it('clearPendingFocus drops queued focus without returning it', () => {
		const store = useSelectionStore();

		store.queuePendingFocus({ kind: 'shape', id: 'shape-2' });
		store.clearPendingFocus();

		expect(store.pendingFocus).toBeNull();
		expect(store.takePendingFocus()).toBeNull();
	});
});

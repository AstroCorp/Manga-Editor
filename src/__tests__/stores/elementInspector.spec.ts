import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';
import { useElementInspectorStore } from '@/stores/elementInspector';
import type { ShapeInspectorApi, TextInspectorApi } from '@/types/inspector';

const shapeApi = {
	elementId: ref('shape-1'),
} as ShapeInspectorApi;

const textApi = {
	elementId: ref('text-1'),
} as TextInspectorApi;

describe('useElementInspectorStore', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('publishes the live shape and text APIs and clears both', () => {
		const store = useElementInspectorStore();

		store.bindShape(shapeApi);
		store.bindText(textApi);

		expect(store.shapeApi).toBe(shapeApi);
		expect(store.textApi).toBe(textApi);

		store.clear();

		expect(store.shapeApi).toBeNull();
		expect(store.textApi).toBeNull();
	});
});

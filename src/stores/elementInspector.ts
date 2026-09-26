import { shallowRef } from 'vue';
import { defineStore } from 'pinia';
import type { ShapeInspectorApi, TextInspectorApi } from '@/types/inspector';

/**
 * Puente entre las features del canvas y el panel Element.
 * Las refs son las mismas que usa la toolbar, así que el panel
 * ve el elemento que está seleccionado en la página.
 */
export const useElementInspectorStore = defineStore('elementInspector', () => {
	const shapeApi = shallowRef<ShapeInspectorApi | null>(null);
	const textApi = shallowRef<TextInspectorApi | null>(null);

	const bindShape = (api: ShapeInspectorApi) => {
		shapeApi.value = api;
	};

	const bindText = (api: TextInspectorApi) => {
		textApi.value = api;
	};

	const clear = () => {
		shapeApi.value = null;
		textApi.value = null;
	};

	return {
		shapeApi,
		textApi,
		bindShape,
		bindText,
		clear,
	};
});

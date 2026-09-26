import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { defineComponent, nextTick, ref, shallowRef } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { useEditorCanvas } from '@/composables/fabric/useEditorCanvas';
import { CONTROL_PASTEBOARD } from '@/lib/fabric/fabricSetup';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';

const harness = vi.hoisted(() => {
	return {
		fabricCanvas: {
			value: null as {
				backgroundColor: string;
				requestRenderAll: ReturnType<typeof vi.fn>;
				discardActiveObject: ReturnType<typeof vi.fn>;
			} | null,
		},
		init: vi.fn(),
		hydratePage: vi.fn(async () => undefined),
		exportDataUrl: vi.fn(),
		dispose: vi.fn(),
	};
});

vi.mock('@/lib/fabric/createFabricCanvasController', () => {
	return {
		createFabricCanvasController: () => harness,
	};
});

vi.mock('@/features/index', () => {
	return {
		canvasFeatures: [],
	};
});

type CanvasHost = {
	rootStyle: { padding: string };
	pageBackgroundStyle: { backgroundColor: string };
};

describe('useEditorCanvas', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		harness.fabricCanvas.value = null;
		harness.init.mockClear();
		harness.hydratePage.mockClear();
		harness.dispose.mockClear();
	});

	it('hydrates the active page, pads the pasteboard and repaints the background', async () => {
		const canvasEl = ref<HTMLCanvasElement | null>(
			document.createElement('canvas'),
		);
		const rootEl = ref<HTMLElement | null>(document.createElement('div'));
		const Host = defineComponent({
			setup() {
				return useEditorCanvas(canvasEl, rootEl);
			},
			template: '<div />',
		});
		const mangaStore = useMangaStore();
		const editorStore = useEditorStore();
		const registerCanvas = vi.spyOn(editorStore, 'registerCanvas');
		const wrapper = mount(Host);
		const vm = wrapper.vm as unknown as CanvasHost;

		await flushPromises();

		expect(harness.init).toHaveBeenCalledWith(
			mangaStore.pages[0]?.width,
			mangaStore.pages[0]?.height,
		);
		expect(harness.hydratePage).toHaveBeenCalledOnce();
		expect(registerCanvas).toHaveBeenCalledOnce();
		expect(vm.rootStyle.padding).toBe(`${CONTROL_PASTEBOARD}px`);
		expect(vm.pageBackgroundStyle.backgroundColor).toBe('#ffffff');

		const requestRenderAll = vi.fn();

		harness.fabricCanvas.value = {
			backgroundColor: '#000000',
			requestRenderAll,
			discardActiveObject: vi.fn(),
		};
		mangaStore.setActivePageBackgroundColor('#112233');
		await nextTick();

		expect(harness.fabricCanvas.value.backgroundColor).toBe('#112233');
		expect(requestRenderAll).toHaveBeenCalledOnce();
		expect(vm.pageBackgroundStyle.backgroundColor).toBe('#112233');

		wrapper.unmount();
		expect(harness.dispose).toHaveBeenCalledOnce();
	});

	it('skips init when the canvas element is not mounted', async () => {
		const Host = defineComponent({
			setup() {
				return useEditorCanvas(
					shallowRef(null),
					shallowRef(null),
				);
			},
			template: '<div />',
		});

		mount(Host).unmount();
		await flushPromises();

		expect(harness.init).not.toHaveBeenCalled();
	});
});

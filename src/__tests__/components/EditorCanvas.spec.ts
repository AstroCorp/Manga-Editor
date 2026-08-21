import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, shallowRef } from 'vue';
import EditorCanvas from '@/components/EditorCanvas.vue';
import { useMangaStore } from '@/stores/manga';

// Fabric necesita un contexto 2D real, inexistente en jsdom.
vi.mock('@/lib/fabric/createFabricCanvasController', () => {
	return {
		createFabricCanvasController: () => {
			return {
				fabricCanvas: shallowRef(null),
				init: vi.fn(),
				hydratePage: vi.fn(async () => undefined),
				exportDataUrl: vi.fn(() => null),
				dispose: vi.fn(),
			};
		},
	};
});

/** Deja pasar el hydrate asíncrono y los nextTick del zoom. */
const settle = async () => {
	for (let index = 0; index < 6; index += 1) {
		await nextTick();
	}
};

const mountStage = async () => {
	const wrapper = mount(EditorCanvas, { attachTo: document.body });

	await settle();

	const root = wrapper.get('.stage-checker').element as HTMLElement;

	root.scrollLeft = 120;
	root.scrollTop = 340;

	return { wrapper, root };
};

describe('EditorCanvas stage scroll', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('keeps the stage scroll when the page content is re-hydrated', async () => {
		const mangaStore = useMangaStore();
		const { wrapper, root } = await mountStage();

		mangaStore.addLayer();
		await settle();

		expect(root.scrollLeft).toBe(120);
		expect(root.scrollTop).toBe(340);

		wrapper.unmount();
	});

	it('resets the stage scroll when the active page changes', async () => {
		const mangaStore = useMangaStore();
		const { wrapper, root } = await mountStage();

		mangaStore.addPage();
		await settle();

		expect(root.scrollLeft).toBe(0);
		expect(root.scrollTop).toBe(0);

		wrapper.unmount();
	});
});

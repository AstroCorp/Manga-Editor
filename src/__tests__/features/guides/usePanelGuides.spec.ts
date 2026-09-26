import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, shallowRef } from 'vue';
import type { Canvas, FabricObject } from 'fabric';
import { usePanelGuides } from '@/features/guides/usePanelGuides';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';
import type { GridGuideImage } from '@/types/fabric';

const createGridGuideImage = vi.hoisted(() => {
	return vi.fn((_layout: unknown, dotColor: string) => {
		return { isGuide: true, isGridGuide: true, dotColor } as unknown as GridGuideImage;
	});
});

vi.mock('@/lib/fabric/createGridGuide', () => {
	return { createGridGuideImage };
});

const createCanvas = () => {
	const objects: FabricObject[] = [];
	const canvas = {
		getObjects: () => {
			return [...objects];
		},
		add: vi.fn((object: FabricObject) => {
			objects.push(object);
		}),
		remove: vi.fn((object: FabricObject) => {
			const index = objects.indexOf(object);

			if (index >= 0) {
				objects.splice(index, 1);
			}
		}),
		sendObjectToBack: vi.fn(),
		requestRenderAll: vi.fn(),
	} as unknown as Canvas;

	return { canvas, objects };
};

const lastDotColor = (): string | undefined => {
	return createGridGuideImage.mock.calls.at(-1)?.[1];
};

describe('usePanelGuides', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		createGridGuideImage.mockClear();
	});

	it('paints the grid dots with the inverse of the page background', () => {
		const { canvas } = createCanvas();
		const mangaStore = useMangaStore();
		const editorStore = useEditorStore();

		editorStore.showGridGuides = true;
		mangaStore.setActivePageBackgroundColor('#ffe4c4');

		const { refreshGuides } = usePanelGuides(shallowRef<Canvas | null>(canvas));

		refreshGuides();

		expect(lastDotColor()).toBe('#001b3b');
	});

	it('re-renders the grid when the active page background changes', async () => {
		const { canvas, objects } = createCanvas();
		const mangaStore = useMangaStore();
		const editorStore = useEditorStore();

		editorStore.showGridGuides = true;

		const { refreshGuides } = usePanelGuides(shallowRef<Canvas | null>(canvas));

		refreshGuides();

		expect(lastDotColor()).toBe('#000000');
		expect(objects).toHaveLength(1);

		mangaStore.setActivePageBackgroundColor('#000000');
		await nextTick();

		expect(lastDotColor()).toBe('#ffffff');
		expect(objects).toHaveLength(1);
		expect(objects[0]).toBe(createGridGuideImage.mock.results.at(-1)?.value);
	});
});

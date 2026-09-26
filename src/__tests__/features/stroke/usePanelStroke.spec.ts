import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, shallowRef } from 'vue';
import type { Canvas, FabricObject } from 'fabric';
import { usePanelStroke } from '@/features/stroke/usePanelStroke';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';

type CanvasStub = {
	selection: boolean;
	defaultCursor: string;
	on: (name: string, handler: () => void) => void;
	off: () => void;
	remove: () => void;
	getObjects: () => FabricObject[];
	forEachObject: (callback: (object: FabricObject) => void) => void;
};

const createCanvas = (objects: FabricObject[] = []) => {
	const canvas: CanvasStub = {
		selection: true,
		defaultCursor: 'default',
		on: () => undefined,
		off: () => undefined,
		remove: () => undefined,
		requestRenderAll: () => undefined,
		getObjects: () => objects,
		forEachObject: (callback) => {
			objects.forEach(callback);
		},
	};

	return canvas;
};

const panelOnLayer = (layerId: string): FabricObject => {
	return {
		selectable: true,
		evented: true,
		lockMovementX: false,
		hasControls: true,
		get: (key: string) => {
			if (key === 'objectType') {
				return FABRIC_OBJECT_TYPE.Panel;
			}

			if (key === 'layerId') {
				return layerId;
			}

			if (key === 'panelId') {
				return 'panel-1';
			}

			return undefined;
		},
	} as unknown as FabricObject;
};

describe('usePanelStroke', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('locks idle panels and switches to crosshair while a stroke is open', () => {
		const mangaStore = useMangaStore();
		const panel = panelOnLayer(mangaStore.activeLayer.id);
		const other = panelOnLayer('other-layer');
		const canvas = createCanvas([panel, other]);
		const stroke = usePanelStroke(
			shallowRef(canvas as unknown as Canvas),
		);

		expect(canvas.selection).toBe(true);
		expect(canvas.defaultCursor).toBe('default');
		expect(panel.selectable).toBe(true);
		expect(panel.lockMovementX).toBe(true);
		expect(panel.hasControls).toBe(false);
		expect(other.selectable).toBe(false);
		expect(other.evented).toBe(false);

		stroke.path.value = [{ col: 0, row: 0 }];
		stroke.syncInteractionMode();

		expect(canvas.selection).toBe(false);
		expect(canvas.defaultCursor).toBe('crosshair');
		expect(panel.selectable).toBe(false);
	});

	it('drops the open stroke when guides are hidden', async () => {
		const canvas = createCanvas();
		const stroke = usePanelStroke(
			shallowRef(canvas as unknown as Canvas),
		);
		const editorStore = useEditorStore();

		stroke.path.value = [{ col: 1, row: 2 }];
		editorStore.showGridGuides = false;
		await nextTick();

		expect(stroke.path.value).toEqual([]);
		expect(canvas.defaultCursor).toBe('default');
	});
});

import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, shallowRef } from 'vue';
import type { Canvas } from 'fabric';
import { useGridPointHover } from '@/features/grid-hover/useGridPointHover';
import { useEditorStore } from '@/stores/editor';
import type { GridPoint } from '@/types/geometry';

type MoveHandler = (event: { scenePoint: { x: number; y: number } }) => void;

const createCanvas = () => {
	const handlers = new Map<string, MoveHandler>();
	const canvas = {
		on: (name: string, handler: MoveHandler) => {
			handlers.set(name, handler);
		},
		off: () => undefined,
		getObjects: () => [],
	} as unknown as Canvas;

	return { canvas, handlers };
};

describe('useGridPointHover', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('labels the span from the last stroke point and clears when the pointer leaves', () => {
		const { canvas, handlers } = createCanvas();
		const strokePath = shallowRef<GridPoint[]>([{ col: 0, row: 0 }]);
		const hover = useGridPointHover({
			fabricCanvas: shallowRef(canvas),
			strokePath,
		});

		handlers.get('mouse:move')?.({ scenePoint: { x: 1600, y: 40 } });

		expect(hover.lineDelta.value).toEqual({ x: 81, y: 2 });
		expect(hover.labelPosition.value).toEqual({ left: 1612, top: 52 });

		handlers.get('mouse:out')?.({ scenePoint: { x: 0, y: 0 } });
		expect(hover.lineDelta.value).toBeNull();
		expect(hover.labelPosition.value).toBeNull();
	});

	it('clears the label when guides hide or the stroke path is empty', async () => {
		const { canvas, handlers } = createCanvas();
		const strokePath = shallowRef<GridPoint[]>([{ col: 0, row: 0 }]);
		const hover = useGridPointHover({
			fabricCanvas: shallowRef(canvas),
			strokePath,
		});
		const editorStore = useEditorStore();

		handlers.get('mouse:move')?.({ scenePoint: { x: 1600, y: 40 } });
		expect(hover.lineDelta.value).not.toBeNull();

		editorStore.showGridGuides = false;
		await nextTick();
		expect(hover.lineDelta.value).toBeNull();

		editorStore.showGridGuides = true;
		handlers.get('mouse:move')?.({ scenePoint: { x: 1600, y: 40 } });
		expect(hover.labelPosition.value).not.toBeNull();

		strokePath.value = [];
		await nextTick();
		expect(hover.lineDelta.value).toBeNull();
		expect(hover.labelPosition.value).toBeNull();
	});
});

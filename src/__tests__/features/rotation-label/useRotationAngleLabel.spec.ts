import { describe, expect, it, vi } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import {
	formatRotationAngle,
	useRotationAngleLabel,
} from '@/features/rotation-label/useRotationAngleLabel';
import type { Canvas, FabricObject } from 'fabric';

describe('formatRotationAngle', () => {
	it('keeps a single decimal and wraps to 0°', () => {
		expect(formatRotationAngle(0)).toBe('0°');
		expect(formatRotationAngle(20)).toBe('20°');
		expect(formatRotationAngle(22.5)).toBe('22.5°');
		expect(formatRotationAngle(20.04)).toBe('20°');
		expect(formatRotationAngle(359.96)).toBe('0°');
		expect(formatRotationAngle(-22.5)).toBe('337.5°');
		expect(formatRotationAngle(Number.NaN)).toBe('0°');
	});
});

describe('useRotationAngleLabel', () => {
	const createCanvas = () => {
		const handlers: Record<string, (event?: unknown) => void> = {};
		const canvas = {
			on: (event: string, handler: (event?: unknown) => void) => {
				handlers[event] = handler;
			},
			off: vi.fn(),
		} as unknown as Canvas;

		return { canvas, handlers };
	};

	it('shows the angle while rotating and hides it on mouse up', () => {
		const { canvas, handlers } = createCanvas();
		const api = useRotationAngleLabel({
			fabricCanvas: shallowRef(canvas),
		});

		handlers['object:rotating']?.({
			target: { angle: 22.5 } as FabricObject,
			pointer: { x: 100, y: 80 },
		});

		expect(api.angle.value).toBe(22.5);
		expect(api.position.value).toEqual({ left: 112, top: 92 });

		handlers['mouse:up']?.();

		expect(api.angle.value).toBeNull();
		expect(api.position.value).toBeNull();
	});

	it('shows the current angle as soon as the rotate handle is pressed', () => {
		const { canvas, handlers } = createCanvas();
		const api = useRotationAngleLabel({
			fabricCanvas: shallowRef(canvas),
		});

		handlers['mouse:down']?.({
			target: { angle: 45 } as FabricObject,
			scenePoint: { x: 10, y: 20 },
			transform: { action: 'rotate' },
		});

		expect(api.angle.value).toBe(45);
		expect(api.position.value).toEqual({ left: 22, top: 32 });
	});

	it('ignores mouse down when the action is not rotate', () => {
		const { canvas, handlers } = createCanvas();
		const api = useRotationAngleLabel({
			fabricCanvas: shallowRef(canvas),
		});

		handlers['mouse:down']?.({
			target: { angle: 10 } as FabricObject,
			scenePoint: { x: 10, y: 20 },
			transform: { action: 'scale' },
		});

		expect(api.angle.value).toBeNull();
	});

	it('hides the label when selection is cleared', () => {
		const { canvas, handlers } = createCanvas();
		const api = useRotationAngleLabel({
			fabricCanvas: shallowRef(canvas),
		});

		handlers['object:rotating']?.({
			target: { angle: 90 } as FabricObject,
			pointer: { x: 4, y: 8 },
		});

		handlers['selection:cleared']?.();

		expect(api.angle.value).toBeNull();
		expect(api.position.value).toBeNull();
	});

	it('ignores rotating events without a pointer or target', () => {
		const { canvas, handlers } = createCanvas();
		const api = useRotationAngleLabel({
			fabricCanvas: shallowRef(canvas),
		});

		handlers['object:rotating']?.({
			target: { angle: 12 } as FabricObject,
		});
		handlers['object:rotating']?.({
			pointer: { x: 1, y: 2 },
		});

		expect(api.angle.value).toBeNull();
	});

	it('defaults a missing object angle to 0', () => {
		const { canvas, handlers } = createCanvas();
		const api = useRotationAngleLabel({
			fabricCanvas: shallowRef(canvas),
		});

		handlers['object:rotating']?.({
			target: {} as FabricObject,
			pointer: { x: 0, y: 0 },
		});

		expect(api.angle.value).toBe(0);
	});

	it('unbinds canvas events when the canvas is removed', async () => {
		const { canvas, handlers } = createCanvas();
		const fabricCanvas = shallowRef<Canvas | null>(canvas);
		const api = useRotationAngleLabel({ fabricCanvas });

		handlers['object:rotating']?.({
			target: { angle: 15 } as FabricObject,
			pointer: { x: 1, y: 1 },
		});

		expect(api.angle.value).toBe(15);

		fabricCanvas.value = null;
		await nextTick();

		expect(canvas.off).toHaveBeenCalled();
		expect(api.angle.value).toBeNull();
	});
});

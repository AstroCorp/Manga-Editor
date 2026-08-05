import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { shallowRef } from 'vue';
import { useShapeActionMenu } from '@/features/shape-menu/useShapeActionMenu';
import { panelFillColor } from '@/lib/fabric/fabricColors';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import { Shape } from '@/models/Shape';
import { useMangaStore } from '@/stores/manga';
import type { Canvas, FabricObject } from 'fabric';

describe('useShapeActionMenu', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('toggleWhiteFill updates domain and fabric panel fill', () => {
		const mangaStore = useMangaStore();
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 20, y: 0 },
				{ x: 20, y: 20 },
			],
			2,
		);

		mangaStore.addShape(shape);

		const panelState = { fill: panelFillColor(false) };
		const panel = {
			getBoundingRect: () => {
				return { left: 0, top: 0, width: 20, height: 20 };
			},
			get: (key: string) => {
				if (key === 'objectType') {
					return FABRIC_OBJECT_TYPE.Panel;
				}

				if (key === 'panelId') {
					return shape.id;
				}

				return undefined;
			},
			set: vi.fn((props: { fill?: string }) => {
				if (props.fill !== undefined) {
					panelState.fill = props.fill;
				}
			}),
		};
		const handlers: Record<string, () => void> = {};
		const canvas = {
			on: (event: string, handler: () => void) => {
				handlers[event] = handler;
			},
			off: vi.fn(),
			getActiveObject: () => {
				return panel as unknown as FabricObject;
			},
			getObjects: () => {
				return [panel as unknown as FabricObject];
			},
			requestRenderAll: vi.fn(),
		} as unknown as Canvas;

		const fabricCanvas = shallowRef<Canvas | null>(canvas);
		const onChanged = vi.fn();
		const api = useShapeActionMenu({ fabricCanvas, onChanged });

		handlers['selection:created']?.();

		expect(api.whiteFill.value).toBe(false);

		api.toggleWhiteFill();

		expect(shape.whiteFill).toBe(true);
		expect(panel.set).toHaveBeenCalledWith({
			fill: panelFillColor(true),
		});
		expect(api.whiteFill.value).toBe(true);
		expect(onChanged).toHaveBeenCalled();
		expect(canvas.requestRenderAll).toHaveBeenCalled();
	});

	it('toggleWhiteFill is a no-op without selection', () => {
		const fabricCanvas = shallowRef<Canvas | null>(null);
		const api = useShapeActionMenu({ fabricCanvas });

		expect(() => {
			api.toggleWhiteFill();
		}).not.toThrow();
	});
});

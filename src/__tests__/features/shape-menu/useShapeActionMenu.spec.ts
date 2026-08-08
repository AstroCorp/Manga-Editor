import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { shallowRef } from 'vue';
import { useShapeActionMenu } from '@/features/shape-menu/useShapeActionMenu';
import { panelFillColor } from '@/lib/fabric/fabricColors';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import { useMangaStore } from '@/stores/manga';
import type { Canvas, FabricObject } from 'fabric';

const createPanelMock = (shapeId: string, fill = panelFillColor(false)) => {
	const panelState = { fill };
	const panel = {
		evented: false,
		selectable: false,
		getBoundingRect: () => {
			return { left: 0, top: 0, width: 20, height: 20 };
		},
		get: (key: string) => {
			if (key === 'objectType') {
				return FABRIC_OBJECT_TYPE.Panel;
			}

			if (key === 'panelId') {
				return shapeId;
			}

			return undefined;
		},
		set: vi.fn((props: { fill?: string }) => {
			if (props.fill !== undefined) {
				panelState.fill = props.fill;
			}
		}),
	};

	return { panel, panelState };
};

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

		const { panel } = createPanelMock(shape.id);
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
			fill: panelFillColor(true, { hasImage: false }),
		});
		expect(api.whiteFill.value).toBe(true);
		expect(onChanged).toHaveBeenCalled();
		expect(canvas.requestRenderAll).toHaveBeenCalled();
	});

	it('toggleWhiteFill keeps transparent fabric fill when panel has image', () => {
		const mangaStore = useMangaStore();
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 20, y: 0 },
				{ x: 20, y: 20 },
			],
			2,
		);

		shape.setImage(
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 10,
				top: 10,
				scaleX: 1,
				scaleY: 1,
				width: 10,
				height: 10,
			}),
		);
		mangaStore.addShape(shape);

		const { panel } = createPanelMock(
			shape.id,
			panelFillColor(false, { hasImage: true }),
		);
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

		const api = useShapeActionMenu({
			fabricCanvas: shallowRef(canvas),
			onChanged: vi.fn(),
		});

		handlers['selection:created']?.();
		api.toggleWhiteFill();

		expect(shape.whiteFill).toBe(true);
		expect(panel.set).toHaveBeenCalledWith({
			fill: panelFillColor(true, { hasImage: true }),
		});
	});

	it('clearImage restores panel fill from whiteFill preference', () => {
		const mangaStore = useMangaStore();
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 20, y: 0 },
				{ x: 20, y: 20 },
			],
			2,
		);

		shape.setWhiteFill(true);
		shape.setImage(
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 10,
				top: 10,
				scaleX: 1,
				scaleY: 1,
				width: 10,
				height: 10,
			}),
		);
		mangaStore.addShape(shape);

		const { panel } = createPanelMock(
			shape.id,
			panelFillColor(true, { hasImage: true }),
		);
		const image = {
			getBoundingRect: () => {
				return { left: 0, top: 0, width: 20, height: 20 };
			},
			get: (key: string) => {
				if (key === 'objectType') {
					return FABRIC_OBJECT_TYPE.PanelImage;
				}

				if (key === 'panelId') {
					return shape.id;
				}

				return undefined;
			},
		};
		const objects = [panel as unknown as FabricObject, image as FabricObject];
		let active: FabricObject | null = image as FabricObject;
		const handlers: Record<string, () => void> = {};
		const canvas = {
			on: (event: string, handler: () => void) => {
				handlers[event] = handler;
			},
			off: vi.fn(),
			getActiveObject: () => {
				return active;
			},
			getObjects: () => {
				return objects;
			},
			remove: vi.fn((object: FabricObject) => {
				const index = objects.indexOf(object);

				if (index >= 0) {
					objects.splice(index, 1);
				}
			}),
			setActiveObject: vi.fn((object: FabricObject) => {
				active = object;
			}),
			discardActiveObject: vi.fn(() => {
				active = null;
			}),
			requestRenderAll: vi.fn(),
		} as unknown as Canvas;

		const onChanged = vi.fn();
		const api = useShapeActionMenu({
			fabricCanvas: shallowRef(canvas),
			onChanged,
		});

		handlers['selection:created']?.();
		expect(api.hasImage.value).toBe(true);

		api.clearImage();

		expect(shape.image).toBeNull();
		expect(canvas.remove).toHaveBeenCalledWith(image);
		expect(panel.evented).toBe(true);
		expect(panel.selectable).toBe(true);
		expect(panel.set).toHaveBeenCalledWith({
			fill: panelFillColor(true),
		});
		expect(canvas.setActiveObject).toHaveBeenCalledWith(panel);
		expect(onChanged).toHaveBeenCalled();
	});

	it('toggleWhiteFill is a no-op without selection', () => {
		const fabricCanvas = shallowRef<Canvas | null>(null);
		const api = useShapeActionMenu({ fabricCanvas });

		expect(() => {
			api.toggleWhiteFill();
		}).not.toThrow();
	});
});

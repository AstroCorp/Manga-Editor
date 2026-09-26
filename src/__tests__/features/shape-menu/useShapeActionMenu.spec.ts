import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { shallowRef } from 'vue';
import { useShapeActionMenu } from '@/features/shape-menu/useShapeActionMenu';
import { panelFillColor } from '@/lib/fabric/fabricColors';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import { shapeToPolygon } from '@/lib/fabric/shapeFabric';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import { useHistoryStore } from '@/stores/history';
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

const createShapeWithImage = () => {
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

	return shape;
};

const createFabricImageMock = (shapeId: string) => {
	const image = {
		flipX: false,
		flipY: false,
		left: 10,
		top: 10,
		scaleX: 1,
		scaleY: 1,
		originX: 'center',
		originY: 'center',
		width: 10,
		height: 10,
		angle: 0,
		filters: [] as Array<{ type?: string }>,
		getSrc: () => {
			return 'data:image/png;base64,xx';
		},
		getBoundingRect: () => {
			return { left: 0, top: 0, width: 20, height: 20 };
		},
		get: (key: string) => {
			if (key === 'objectType') {
				return FABRIC_OBJECT_TYPE.PanelImage;
			}

			if (key === 'panelId') {
				return shapeId;
			}

			if (key === 'src') {
				return 'data:image/png;base64,xx';
			}

			return undefined;
		},
		set: vi.fn((props: { flipX?: boolean; flipY?: boolean }) => {
			if (props.flipX !== undefined) {
				image.flipX = props.flipX;
			}

			if (props.flipY !== undefined) {
				image.flipY = props.flipY;
			}
		}),
		setCoords: vi.fn(),
	};

	return image;
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

	it('toggles are no-ops without selection', () => {
		const api = useShapeActionMenu({
			fabricCanvas: shallowRef<Canvas | null>(null),
		});

		expect(() => {
			api.toggleWhiteFill();
			api.toggleFlipX();
			api.toggleFlipY();
		}).not.toThrow();
	});

	it('toggleFlipX and toggleFlipY persist on the domain image', () => {
		const mangaStore = useMangaStore();
		const shape = createShapeWithImage();

		mangaStore.addShape(shape);

		const { panel } = createPanelMock(shape.id);
		const fabricImage = createFabricImageMock(shape.id);
		const handlers: Record<string, () => void> = {};
		const canvas = {
			on: (event: string, handler: () => void) => {
				handlers[event] = handler;
			},
			off: vi.fn(),
			getActiveObject: () => {
				return fabricImage as unknown as FabricObject;
			},
			getObjects: () => {
				return [panel as unknown as FabricObject, fabricImage as unknown as FabricObject];
			},
			requestRenderAll: vi.fn(),
		} as unknown as Canvas;

		const onChanged = vi.fn();
		const api = useShapeActionMenu({
			fabricCanvas: shallowRef(canvas),
			onChanged,
		});

		handlers['selection:created']?.();

		expect(api.isFlipX.value).toBe(false);
		expect(api.isFlipY.value).toBe(false);

		api.toggleFlipX();

		expect(fabricImage.set).toHaveBeenCalledWith({ flipX: true });
		expect(fabricImage.setCoords).toHaveBeenCalled();
		expect(shape.image?.flipX).toBe(true);
		expect(api.isFlipX.value).toBe(true);
		expect(onChanged).toHaveBeenCalled();

		api.toggleFlipY();

		expect(fabricImage.set).toHaveBeenCalledWith({ flipY: true });
		expect(shape.image?.flipY).toBe(true);
		expect(api.isFlipY.value).toBe(true);
	});

	it('exposes edge strokes and syncs the fabric polygon on edge changes', () => {
		const mangaStore = useMangaStore();
		const historyStore = useHistoryStore();
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 20, y: 0 },
				{ x: 20, y: 20 },
			],
			2,
		);

		mangaStore.addShape(shape);

		const panel = shapeToPolygon(shape, {
			layerId: mangaStore.activeLayer.id,
			interactive: true,
		});
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
		const api = useShapeActionMenu({ fabricCanvas: shallowRef(canvas) });

		handlers['selection:created']?.();

		expect(api.strokes.value).toEqual(shape.strokes);
		expect(api.strokes.value).not.toBe(shape.strokes);

		const entriesBefore = historyStore.entries.length;

		api.previewEdgeStroke(1, { color: '#ff0000' });

		expect(shape.strokes[1]).toEqual({ width: 2, color: '#ff0000' });
		expect(panel.edgeStrokes?.[1]).toEqual({ width: 2, color: '#ff0000' });
		expect(historyStore.entries).toHaveLength(entriesBefore);

		api.setEdgeStroke(1, { width: 9 });

		expect(shape.strokes[1]).toEqual({ width: 9, color: '#ff0000' });
		expect(panel.edgeStrokes?.[1]).toEqual({ width: 9, color: '#ff0000' });
		expect(panel.strokeWidth).toBe(9);
		expect(api.strokes.value[1]).toEqual({ width: 9, color: '#ff0000' });
		expect(historyStore.entries).toHaveLength(entriesBefore + 1);
		expect(canvas.requestRenderAll).toHaveBeenCalled();

		api.setEdgeStroke(7, { width: 1 });

		expect(historyStore.entries).toHaveLength(entriesBefore + 1);

		handlers['selection:cleared']?.();

		expect(api.strokes.value).toEqual([]);
	});

	it('draws a guide over the hovered edge and drops it when the hover ends', () => {
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

		const panel = shapeToPolygon(shape, {
			layerId: mangaStore.activeLayer.id,
			interactive: true,
		});
		const handlers: Record<string, () => void> = {};
		const added: FabricObject[] = [];
		const canvas = {
			on: (event: string, handler: () => void) => {
				handlers[event] = handler;
			},
			off: vi.fn(),
			getActiveObject: () => {
				return panel as unknown as FabricObject;
			},
			getObjects: () => {
				return [panel as unknown as FabricObject, ...added];
			},
			add: vi.fn((object: FabricObject) => {
				added.push(object);
			}),
			remove: vi.fn((object: FabricObject) => {
				const index = added.indexOf(object);

				if (index >= 0) {
					added.splice(index, 1);
				}
			}),
			bringObjectToFront: vi.fn(),
			requestRenderAll: vi.fn(),
		} as unknown as Canvas;
		const api = useShapeActionMenu({ fabricCanvas: shallowRef(canvas) });

		handlers['selection:created']?.();
		api.highlightEdge(0);

		const line = added[0] as FabricObject & {
			isGuide?: boolean;
			stroke?: string;
			strokeWidth?: number;
			points?: Array<{ x: number; y: number }>;
			excludeFromExport?: boolean;
		};

		expect(added).toHaveLength(1);
		expect(line.isGuide).toBe(true);
		expect(line.excludeFromExport).toBe(true);
		expect(line.stroke).toBe('#2563eb');
		expect(line.strokeWidth).toBe(10);
		expect(line.points).toEqual([
			{ x: 0, y: 0 },
			{ x: 20, y: 0 },
		]);
		expect(canvas.bringObjectToFront).toHaveBeenCalledWith(line);

		api.highlightEdge(1);

		expect(added).toHaveLength(1);
		expect(line.points).toEqual([
			{ x: 20, y: 0 },
			{ x: 20, y: 20 },
		]);

		api.setEdgeStroke(1, { width: 20 });

		expect(line.strokeWidth).toBe(28);
		expect(shape.strokes[0]?.width).toBe(2);

		api.highlightEdge(null);

		expect(added).toHaveLength(0);
		expect(canvas.remove).toHaveBeenCalledWith(line);

		api.highlightEdge(2);
		handlers['selection:cleared']?.();

		expect(added).toHaveLength(0);
		expect(api.strokes.value).toEqual([]);
	});
});

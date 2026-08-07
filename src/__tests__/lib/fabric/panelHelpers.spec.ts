import { describe, it, expect, vi } from 'vitest';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import {
	collectPanelIdsWithImage,
	findPanelById,
	getPanelId,
	getTextId,
	isGridGuide,
	isGuide,
	isPageText,
	isPanel,
	isPanelImage,
	removeObjectsByPanelId,
	stackPageContent,
} from '@/lib/fabric/isGuide';
import type { Canvas, FabricObject } from 'fabric';

const createObject = (props: {
	objectType?: string;
	panelId?: string;
	textId?: string;
	layerId?: string;
	isGuide?: boolean;
	isGridGuide?: boolean;
}) => {
	return {
		isGuide: props.isGuide,
		isGridGuide: props.isGridGuide,
		get: (key: string) => {
			if (key === 'objectType') {
				return props.objectType;
			}

			if (key === 'panelId') {
				return props.panelId;
			}

			if (key === 'textId') {
				return props.textId;
			}

			if (key === 'layerId') {
				return props.layerId;
			}

			if (key === 'isGuide') {
				return props.isGuide;
			}

			if (key === 'isGridGuide') {
				return props.isGridGuide;
			}

			return undefined;
		},
	} as unknown as FabricObject;
};

describe('panel fabric helpers', () => {
	it('isGuide / isGridGuide / getPanelId read fabric markers', () => {
		expect(isGuide(createObject({ isGuide: true }))).toBe(true);
		expect(isGuide(createObject({}))).toBe(false);
		expect(isGridGuide(createObject({ isGridGuide: true }))).toBe(true);
		expect(getPanelId(createObject({ panelId: 'p1' }))).toBe('p1');
		expect(getPanelId(createObject({ panelId: '' }))).toBeUndefined();
		expect(getPanelId(createObject({}))).toBeUndefined();
	});

	it('removeObjectsByPanelId removes panel and image for that id', () => {
		const keep = createObject({
			objectType: FABRIC_OBJECT_TYPE.Panel,
			panelId: 'keep',
		});
		const panel = createObject({
			objectType: FABRIC_OBJECT_TYPE.Panel,
			panelId: 'drop',
		});
		const image = createObject({
			objectType: FABRIC_OBJECT_TYPE.PanelImage,
			panelId: 'drop',
		});
		const objects = [keep, panel, image];
		const remove = vi.fn((object: FabricObject) => {
			const index = objects.indexOf(object);

			if (index >= 0) {
				objects.splice(index, 1);
			}
		});
		const canvas = {
			getObjects: () => {
				return objects.slice();
			},
			remove,
		} as unknown as Canvas;

		removeObjectsByPanelId(canvas, 'drop');

		expect(remove).toHaveBeenCalledTimes(2);
		expect(objects).toEqual([keep]);
	});

	it('isPanelImage detects panelImage objectType', () => {
		expect(
			isPanelImage(
				createObject({ objectType: FABRIC_OBJECT_TYPE.PanelImage }),
			),
		).toBe(true);
		expect(
			isPanelImage(createObject({ objectType: FABRIC_OBJECT_TYPE.Panel })),
		).toBe(false);
	});

	it('isPageText / getTextId detect text objects', () => {
		const text = createObject({
			objectType: FABRIC_OBJECT_TYPE.Text,
			textId: 'txt-1',
		});

		expect(isPageText(text)).toBe(true);
		expect(getTextId(text)).toBe('txt-1');
		expect(
			isPageText(createObject({ objectType: FABRIC_OBJECT_TYPE.Panel })),
		).toBe(false);
		expect(getTextId(createObject({ textId: '' }))).toBeUndefined();
	});

	it('isPageText / getTextId resuelven hijos del Group boxed', () => {
		const group = createObject({
			objectType: FABRIC_OBJECT_TYPE.Text,
			textId: 'boxed-1',
			layerId: 'layer-a',
		});
		const child = createObject({});
		(child as { group?: unknown }).group = group;

		expect(isPageText(child)).toBe(true);
		expect(getTextId(child)).toBe('boxed-1');
	});

	it('findPanelById returns only panel polygons', () => {
		const panel = createObject({
			objectType: FABRIC_OBJECT_TYPE.Panel,
			panelId: 'p1',
		});
		const image = createObject({
			objectType: FABRIC_OBJECT_TYPE.PanelImage,
			panelId: 'p1',
		});
		const canvas = {
			getObjects: () => {
				return [image, panel];
			},
		} as unknown as Canvas;

		expect(findPanelById(canvas, 'p1')).toBe(panel);
		expect(findPanelById(canvas, 'missing')).toBeNull();
		expect(isPanel(panel)).toBe(true);
		expect(isPanel(image)).toBe(false);
	});

	it('collectPanelIdsWithImage gathers panel ids from images', () => {
		const canvas = {
			getObjects: () => {
				return [
					createObject({
						objectType: FABRIC_OBJECT_TYPE.PanelImage,
						panelId: 'a',
					}),
					createObject({
						objectType: FABRIC_OBJECT_TYPE.Panel,
						panelId: 'a',
					}),
					createObject({
						objectType: FABRIC_OBJECT_TYPE.PanelImage,
						panelId: 'b',
					}),
				];
			},
		} as unknown as Canvas;

		expect([...collectPanelIdsWithImage(canvas)].sort()).toEqual(['a', 'b']);
	});

	it('stackPageContent orders guides, other, panels, then images', () => {
		const guide = createObject({ isGuide: true });
		const other = createObject({});
		const image = createObject({
			objectType: FABRIC_OBJECT_TYPE.PanelImage,
			panelId: 'p1',
		});
		const panel = createObject({
			objectType: FABRIC_OBJECT_TYPE.Panel,
			panelId: 'p1',
		});
		const objects = [panel, image, other, guide];
		const moveObjectTo = vi.fn();
		const canvas = {
			getObjects: () => {
				return objects;
			},
			moveObjectTo,
		} as unknown as Canvas;

		stackPageContent(canvas);

		expect(moveObjectTo.mock.calls.map((call) => call[0])).toEqual([
			guide,
			other,
			panel,
			image,
		]);
		expect(moveObjectTo.mock.calls.map((call) => call[1])).toEqual([
			0, 1, 2, 3,
		]);
	});

	it('stackPageContent places texts after images per layer', () => {
		const panel = createObject({
			objectType: FABRIC_OBJECT_TYPE.Panel,
			panelId: 'p1',
			layerId: 'layer',
		});
		const image = createObject({
			objectType: FABRIC_OBJECT_TYPE.PanelImage,
			panelId: 'p1',
			layerId: 'layer',
		});
		const text = createObject({
			objectType: FABRIC_OBJECT_TYPE.Text,
			textId: 't1',
			layerId: 'layer',
		});
		const moveObjectTo = vi.fn();
		const canvas = {
			getObjects: () => {
				return [text, image, panel];
			},
			moveObjectTo,
		} as unknown as Canvas;

		stackPageContent(canvas, ['layer']);

		expect(moveObjectTo.mock.calls.map((call) => call[0])).toEqual([
			panel,
			image,
			text,
		]);
	});

	it('stackPageContent orders by layerOrder with panel then image per layer', () => {
		const bottomPanel = createObject({
			objectType: FABRIC_OBJECT_TYPE.Panel,
			panelId: 'b',
			layerId: 'bottom',
		});
		const bottomImage = createObject({
			objectType: FABRIC_OBJECT_TYPE.PanelImage,
			panelId: 'b',
			layerId: 'bottom',
		});
		const topPanel = createObject({
			objectType: FABRIC_OBJECT_TYPE.Panel,
			panelId: 't',
			layerId: 'top',
		});
		const topImage = createObject({
			objectType: FABRIC_OBJECT_TYPE.PanelImage,
			panelId: 't',
			layerId: 'top',
		});
		const orphanPanel = createObject({
			objectType: FABRIC_OBJECT_TYPE.Panel,
			panelId: 'x',
		});
		const moveObjectTo = vi.fn();
		const canvas = {
			getObjects: () => {
				return [topImage, bottomPanel, orphanPanel, topPanel, bottomImage];
			},
			moveObjectTo,
		} as unknown as Canvas;

		stackPageContent(canvas, ['bottom', 'top']);

		expect(moveObjectTo.mock.calls.map((call) => call[0])).toEqual([
			bottomPanel,
			bottomImage,
			topPanel,
			topImage,
			orphanPanel,
		]);
	});
});

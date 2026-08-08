import { describe, expect, it } from 'vitest';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import {
	findPanelById,
	findPanelImageById,
	findShapeFocusTarget,
} from '@/lib/fabric/isGuide';
import type { Canvas, FabricObject } from 'fabric';

const createObject = (
	objectType: string,
	panelId: string,
): FabricObject => {
	return {
		get: (key: string) => {
			if (key === 'objectType') {
				return objectType;
			}

			if (key === 'panelId') {
				return panelId;
			}

			return undefined;
		},
	} as unknown as FabricObject;
};

describe('isGuide shape focus helpers', () => {
	it('prefers panel image over panel polygon for focus', () => {
		const panel = createObject(FABRIC_OBJECT_TYPE.Panel, 'shape-1');
		const image = createObject(FABRIC_OBJECT_TYPE.PanelImage, 'shape-1');
		const canvas = {
			getObjects: () => {
				return [panel, image];
			},
		} as unknown as Canvas;

		expect(findPanelById(canvas, 'shape-1')).toBe(panel);
		expect(findPanelImageById(canvas, 'shape-1')).toBe(image);
		expect(findShapeFocusTarget(canvas, 'shape-1')).toBe(image);
	});

	it('falls back to the panel when there is no image', () => {
		const panel = createObject(FABRIC_OBJECT_TYPE.Panel, 'shape-2');
		const canvas = {
			getObjects: () => {
				return [panel];
			},
		} as unknown as Canvas;

		expect(findShapeFocusTarget(canvas, 'shape-2')).toBe(panel);
		expect(findPanelImageById(canvas, 'shape-2')).toBeNull();
	});
});

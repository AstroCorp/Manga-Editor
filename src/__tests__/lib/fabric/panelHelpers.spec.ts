import { describe, it, expect, vi } from 'vitest';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import {
	collectPanelIdsWithImage,
	findPanelById,
	isPanel,
	isPanelImage,
	stackPageContent,
} from '@/lib/fabric/isGuide';
import type { Canvas, FabricObject } from 'fabric';

const createObject = (props: {
	objectType?: string;
	panelId?: string;
	isGuide?: boolean;
}) => {
	return {
		isGuide: props.isGuide,
		get: (key: string) => {
			if (key === 'objectType') {
				return props.objectType;
			}

			if (key === 'panelId') {
				return props.panelId;
			}

			if (key === 'isGuide') {
				return props.isGuide;
			}

			return undefined;
		},
	} as unknown as FabricObject;
};

describe('panel fabric helpers', () => {
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

	it('stackPageContent orders guides, other, images, then panels', () => {
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
			image,
			panel,
		]);
		expect(moveObjectTo.mock.calls.map((call) => call[1])).toEqual([
			0, 1, 2, 3,
		]);
	});
});

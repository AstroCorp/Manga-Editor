import { describe, expect, it, vi } from 'vitest';
import { getObjectOverlayAnchor } from '@/lib/fabric/overlayAnchor';
import { ROTATE_ICON_SIZE, ROTATE_OFFSET_Y } from '@/lib/fabric/fabricSetup';
import type { FabricObject } from 'fabric';

const createObject = (options: {
	left: number;
	top: number;
	width: number;
	height: number;
	angle?: number;
	bl: { x: number; y: number };
	br: { x: number; y: number };
}) => {
	return {
		angle: options.angle ?? 0,
		setCoords: vi.fn(),
		getBoundingRect: () => {
			return {
				left: options.left,
				top: options.top,
				width: options.width,
				height: options.height,
			};
		},
		aCoords: {
			bl: options.bl,
			br: options.br,
		},
	} as unknown as FabricObject;
};

describe('getObjectOverlayAnchor', () => {
	it('places the toolbar above when the rotate edge is at the bottom', () => {
		const anchor = getObjectOverlayAnchor(
			createObject({
				left: 0,
				top: 40,
				width: 100,
				height: 40,
				bl: { x: 0, y: 80 },
				br: { x: 100, y: 80 },
			}),
		);

		expect(anchor.placement).toBe('above');
		expect(anchor.left).toBe(50);
		expect(anchor.top).toBe(32);
	});

	it('keeps the toolbar above and raises it when the rotate edge is on top', () => {
		const rotateClearance = ROTATE_OFFSET_Y + ROTATE_ICON_SIZE / 2;
		const anchor = getObjectOverlayAnchor(
			createObject({
				left: 10,
				top: 100,
				width: 100,
				height: 40,
				angle: 180,
				bl: { x: 110, y: 100 },
				br: { x: 10, y: 100 },
			}),
		);

		expect(anchor.placement).toBe('above');
		expect(anchor.left).toBe(60);
		expect(anchor.top).toBe(100 - 8 - rotateClearance);
	});
});

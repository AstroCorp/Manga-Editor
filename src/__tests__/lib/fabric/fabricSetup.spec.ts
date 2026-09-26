import { describe, expect, it, vi } from 'vitest';
import { FabricObject, Textbox } from 'fabric';
import {
	CONTROL_PASTEBOARD,
	ROTATE_ICON_SIZE,
	ROTATE_OFFSET_Y,
	setupFabricCustomProperties,
} from '@/lib/fabric/fabricSetup';

describe('fabricSetup', () => {
	it('derives the pasteboard from the rotate handle size', () => {
		expect(CONTROL_PASTEBOARD).toBe(
			ROTATE_OFFSET_Y + ROTATE_ICON_SIZE / 2 + 8,
		);
	});

	it('registers custom properties and a bottom rotate control', () => {
		setupFabricCustomProperties();

		expect(FabricObject.customProperties).toEqual(
			expect.arrayContaining([
				'objectType',
				'panelId',
				'textId',
				'layerId',
			]),
		);
		expect(FabricObject.ownDefaults.transparentCorners).toBe(false);

		const objectControls = FabricObject.createControls().controls;
		const textControls = Textbox.createControls().controls;
		const rotate = objectControls?.mtr;

		expect(rotate?.offsetY).toBe(ROTATE_OFFSET_Y);
		expect(rotate?.actionName).toBe('rotate');
		expect(textControls?.mtr?.offsetY).toBe(ROTATE_OFFSET_Y);

		const ctx = {
			save: vi.fn(),
			restore: vi.fn(),
			translate: vi.fn(),
			rotate: vi.fn(),
			beginPath: vi.fn(),
			arc: vi.fn(),
			fill: vi.fn(),
			stroke: vi.fn(),
			moveTo: vi.fn(),
			lineTo: vi.fn(),
			closePath: vi.fn(),
			fillStyle: '',
			strokeStyle: '',
			lineWidth: 0,
			lineCap: '',
		};

		rotate?.render?.(
			ctx as unknown as CanvasRenderingContext2D,
			10,
			20,
			{},
			{ angle: 15 } as FabricObject,
		);

		expect(ctx.save).toHaveBeenCalled();
		expect(ctx.fill).toHaveBeenCalled();
		expect(ctx.restore).toHaveBeenCalled();
	});
});

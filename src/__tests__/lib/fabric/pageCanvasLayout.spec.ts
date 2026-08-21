import { describe, expect, it, vi } from 'vitest';
import { CONTROL_PASTEBOARD } from '@/lib/fabric/fabricSetup';
import {
	applyPageCanvasLayout,
	pageExportCrop,
} from '@/lib/fabric/pageCanvasLayout';
import type { StaticCanvas } from 'fabric';

describe('pageCanvasLayout', () => {
	it('sizes the canvas with pasteboard and keeps page origin at 0,0', () => {
		const canvas = {
			getWidth: () => {
				return 0;
			},
			getHeight: () => {
				return 0;
			},
			setDimensions: vi.fn(),
			setViewportTransform: vi.fn(),
		} as unknown as StaticCanvas;

		applyPageCanvasLayout(canvas, 800, 1200);

		expect(canvas.setDimensions).toHaveBeenCalledExactlyOnceWith({
			width: 800 + CONTROL_PASTEBOARD * 2,
			height: 1200 + CONTROL_PASTEBOARD * 2,
		});
		expect(canvas.setViewportTransform).toHaveBeenCalledExactlyOnceWith([
			1,
			0,
			0,
			1,
			CONTROL_PASTEBOARD,
			CONTROL_PASTEBOARD,
		]);
		expect(canvas.controlsAboveOverlay).toBe(true);
		expect(canvas.clipPath).toMatchObject({
			left: 0,
			top: 0,
			width: 800,
			height: 1200,
			originX: 'left',
			originY: 'top',
			absolutePositioned: true,
		});
	});

	// Reescribir el bitmap deja el canvas en blanco hasta el próximo render.
	it('does not resize the canvas when the dimensions already match', () => {
		const canvas = {
			getWidth: () => {
				return 800 + CONTROL_PASTEBOARD * 2;
			},
			getHeight: () => {
				return 1200 + CONTROL_PASTEBOARD * 2;
			},
			setDimensions: vi.fn(),
			setViewportTransform: vi.fn(),
		} as unknown as StaticCanvas;

		applyPageCanvasLayout(canvas, 800, 1200);

		expect(canvas.setDimensions).not.toHaveBeenCalled();
		expect(canvas.setViewportTransform).toHaveBeenCalledOnce();
	});

	it('crops export to the page, excluding the pasteboard', () => {
		const canvas = {
			getWidth: () => {
				return 800 + CONTROL_PASTEBOARD * 2;
			},
			getHeight: () => {
				return 1200 + CONTROL_PASTEBOARD * 2;
			},
		} as unknown as StaticCanvas;

		expect(pageExportCrop(canvas)).toEqual({
			left: CONTROL_PASTEBOARD,
			top: CONTROL_PASTEBOARD,
			width: 800,
			height: 1200,
		});
	});
});

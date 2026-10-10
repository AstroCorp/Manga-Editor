import { describe, expect, it, vi } from 'vitest';
import { CONTROL_PASTEBOARD } from '@/lib/fabric/fabricSetup';
import {
	applyPageCanvasLayout,
	growPasteboard,
	MAX_CONTROL_PASTEBOARD,
	minPagePasteboard,
	PASTEBOARD_STEP,
	pasteboardForSceneBounds,
	pasteboardForSelection,
	pasteboardScrollDelta,
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

	it('grows only the sides where the selection leaves the page', () => {
		const pasteboard = pasteboardForSceneBounds(
			{ left: -80, top: 40, width: 200, height: 100 },
			800,
			1200,
		);

		expect(pasteboard.left).toBe(CONTROL_PASTEBOARD + PASTEBOARD_STEP * 2);
		expect(pasteboard.top).toBe(CONTROL_PASTEBOARD);
		expect(pasteboard.right).toBe(CONTROL_PASTEBOARD);
		expect(pasteboard.bottom).toBe(CONTROL_PASTEBOARD);
	});

	it('keeps the minimum pasteboard when the selection stays inside', () => {
		expect(
			pasteboardForSceneBounds(
				{ left: 20, top: 30, width: 100, height: 80 },
				800,
				1200,
			),
		).toEqual(minPagePasteboard());
	});

	it('caps a huge overflow', () => {
		const pasteboard = pasteboardForSceneBounds(
			{ left: -20000, top: 0, width: 10, height: 10 },
			800,
			1200,
		);

		expect(pasteboard.left).toBe(MAX_CONTROL_PASTEBOARD);
	});

	it('reads bounds from the active object', () => {
		const setCoords = vi.fn();
		const pasteboard = pasteboardForSelection(
			{
				setCoords,
				getBoundingRect: () => {
					return { left: -80, top: 40, width: 200, height: 100 };
				},
			},
			800,
			1200,
		);

		expect(setCoords).toHaveBeenCalledOnce();
		expect(pasteboard.left).toBeGreaterThan(CONTROL_PASTEBOARD);
		expect(pasteboardForSelection(null, 800, 1200)).toEqual(
			minPagePasteboard(),
		);
	});

	it('grows without shrinking and shifts scroll with the left and top margin', () => {
		const current = minPagePasteboard();
		const needed = {
			...current,
			left: current.left + PASTEBOARD_STEP,
			bottom: current.bottom + PASTEBOARD_STEP,
		};

		expect(growPasteboard(needed, current)).toEqual(needed);
		expect(pasteboardScrollDelta(current, needed, 2)).toEqual({
			x: PASTEBOARD_STEP * 2,
			y: 0,
		});
	});

	it('applies an asymmetric pasteboard and exports the page rect', () => {
		const pasteboard = {
			left: CONTROL_PASTEBOARD + PASTEBOARD_STEP,
			top: CONTROL_PASTEBOARD,
			right: CONTROL_PASTEBOARD,
			bottom: CONTROL_PASTEBOARD + PASTEBOARD_STEP,
		};
		const canvas = {
			getWidth: () => {
				return 0;
			},
			getHeight: () => {
				return 0;
			},
			setDimensions: vi.fn(),
			setViewportTransform: vi.fn(),
			viewportTransform: [1, 0, 0, 1, pasteboard.left, pasteboard.top],
			clipPath: { width: 800, height: 1200 },
		} as unknown as StaticCanvas;

		applyPageCanvasLayout(canvas, 800, 1200, pasteboard);

		expect(canvas.setDimensions).toHaveBeenCalledExactlyOnceWith({
			width: 800 + pasteboard.left + pasteboard.right,
			height: 1200 + pasteboard.top + pasteboard.bottom,
		});
		expect(canvas.setViewportTransform).toHaveBeenCalledExactlyOnceWith([
			1,
			0,
			0,
			1,
			pasteboard.left,
			pasteboard.top,
		]);
		expect(pageExportCrop(canvas)).toEqual({
			left: pasteboard.left,
			top: pasteboard.top,
			width: 800,
			height: 1200,
		});
	});
});

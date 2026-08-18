import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { EXPORT_IMAGE_FORMAT } from '@/lib/editor/editorEnums';
import { createFabricCanvasController } from '@/lib/fabric/createFabricCanvasController';
import { exportCanvasDataUrl } from '@/lib/fabric/exportCanvasDataUrl';
import type { Canvas } from 'fabric';

vi.mock('@/lib/fabric/fabricSetup', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/lib/fabric/fabricSetup')>();

	return {
		...actual,
		setupFabricCustomProperties: vi.fn(),
	};
});

vi.mock('@/lib/fabric/shapeFabric', () => {
	return {
		hydrateCanvasFromPage: vi.fn(),
	};
});

vi.mock('@/lib/fabric/exportCanvasDataUrl', () => {
	return {
		exportCanvasDataUrl: vi.fn(() => 'data:image/png;base64,abc'),
	};
});

describe('createFabricCanvasController', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	it('exportDataUrl returns null without a canvas', () => {
		const controller = createFabricCanvasController(ref(null));

		expect(controller.exportDataUrl(EXPORT_IMAGE_FORMAT.Png)).toBeNull();
		expect(exportCanvasDataUrl).not.toHaveBeenCalled();
	});

	it('exportDataUrl delegates to exportCanvasDataUrl', () => {
		const controller = createFabricCanvasController(
			ref(document.createElement('canvas')),
		);
		const canvas = { id: 'live' } as unknown as Canvas;

		controller.fabricCanvas.value = canvas;

		expect(controller.exportDataUrl(EXPORT_IMAGE_FORMAT.Jpeg)).toBe(
			'data:image/png;base64,abc',
		);
		expect(exportCanvasDataUrl).toHaveBeenCalledExactlyOnceWith(
			canvas,
			EXPORT_IMAGE_FORMAT.Jpeg,
		);
	});
});

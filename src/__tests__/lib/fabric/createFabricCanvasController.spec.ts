import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { EXPORT_IMAGE_FORMAT } from '@/lib/editor/editorEnums';
import { createFabricCanvasController } from '@/lib/fabric/createFabricCanvasController';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import type { Canvas, FabricObject } from 'fabric';

vi.mock('@/lib/fabric/fabricSetup', () => {
	return {
		setupFabricCustomProperties: vi.fn(),
	};
});

vi.mock('@/lib/fabric/shapeFabric', () => {
	return {
		hydrateCanvasFromPage: vi.fn(),
	};
});

describe('createFabricCanvasController', () => {
	it('exportDataUrl returns null without a canvas', () => {
		const controller = createFabricCanvasController(ref(null));

		expect(controller.exportDataUrl(EXPORT_IMAGE_FORMAT.Png)).toBeNull();
	});

	it('exportDataUrl forces transparent panel fills then restores them', () => {
		const panelState = { fill: '#ffffff' };
		const panel = {
			get fill() {
				return panelState.fill;
			},
			get: (key: string) => {
				if (key === 'objectType') {
					return FABRIC_OBJECT_TYPE.Panel;
				}

				return undefined;
			},
			set: vi.fn((props: { fill?: string }) => {
				if (props.fill !== undefined) {
					panelState.fill = props.fill;
				}
			}),
		};
		const guide = {
			visible: true,
			isGuide: true,
			get: (key: string) => {
				if (key === 'isGuide') {
					return true;
				}

				return undefined;
			},
		};
		const toDataURL = vi.fn(() => {
			expect(panelState.fill).toBe('transparent');
			expect(guide.visible).toBe(false);

			return 'data:image/png;base64,abc';
		});
		const requestRenderAll = vi.fn();
		const controller = createFabricCanvasController(
			ref(document.createElement('canvas')),
		);

		controller.fabricCanvas.value = {
			getObjects: () => {
				return [guide, panel] as unknown as FabricObject[];
			},
			toDataURL,
			requestRenderAll,
		} as unknown as Canvas;

		const result = controller.exportDataUrl(EXPORT_IMAGE_FORMAT.Png);

		expect(result).toBe('data:image/png;base64,abc');
		expect(toDataURL).toHaveBeenCalledExactlyOnceWith({
			format: EXPORT_IMAGE_FORMAT.Png,
			quality: 1,
			multiplier: 1,
		});
		expect(panel.set).toHaveBeenCalledWith({ fill: 'transparent' });
		expect(panelState.fill).toBe('#ffffff');
		expect(guide.visible).toBe(true);
		expect(requestRenderAll).toHaveBeenCalled();
	});
});

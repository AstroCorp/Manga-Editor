import { describe, expect, it, vi } from 'vitest';
import { EXPORT_IMAGE_FORMAT } from '@/lib/editor/editorEnums';
import { exportCanvasDataUrl } from '@/lib/fabric/exportCanvasDataUrl';
import { CONTROL_PASTEBOARD } from '@/lib/fabric/fabricSetup';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import type { FabricObject, StaticCanvas } from 'fabric';

describe('exportCanvasDataUrl', () => {
	it('forces transparent panel fills then restores them', () => {
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
			expect(canvas.backgroundColor).toBe('#ffffff');

			return 'data:image/png;base64,abc';
		});
		const requestRenderAll = vi.fn();
		const canvas = {
			backgroundColor: '',
			getWidth: () => {
				return 800 + CONTROL_PASTEBOARD * 2;
			},
			getHeight: () => {
				return 1200 + CONTROL_PASTEBOARD * 2;
			},
			getObjects: () => {
				return [guide, panel] as unknown as FabricObject[];
			},
			toDataURL,
			requestRenderAll,
		} as unknown as StaticCanvas;

		const result = exportCanvasDataUrl(canvas, EXPORT_IMAGE_FORMAT.Png);

		expect(result).toBe('data:image/png;base64,abc');
		expect(toDataURL).toHaveBeenCalledExactlyOnceWith({
			format: EXPORT_IMAGE_FORMAT.Png,
			quality: 1,
			multiplier: 1,
			left: CONTROL_PASTEBOARD,
			top: CONTROL_PASTEBOARD,
			width: 800,
			height: 1200,
		});
		expect(panel.set).toHaveBeenCalledWith({ fill: 'transparent' });
		expect(panelState.fill).toBe('#ffffff');
		expect(guide.visible).toBe(true);
		expect(canvas.backgroundColor).toBe('');
		expect(requestRenderAll).toHaveBeenCalled();
	});
});

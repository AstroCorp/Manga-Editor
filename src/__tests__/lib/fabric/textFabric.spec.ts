import { describe, expect, it, vi } from 'vitest';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import { getTextId, isPageText } from '@/lib/fabric/isGuide';
import { TextBlock } from '@/models/TextBlock';
import type { PageTextObject } from '@/types/fabric';

const { TextboxMock } = vi.hoisted(() => {
	class TextboxMock {
		text: string;
		[key: string]: unknown;

		constructor(text: string, options: Record<string, unknown> = {}) {
			this.text = text;
			Object.assign(this, options);
		}

		set(props: Record<string, unknown>) {
			Object.assign(this, props);
		}

		_set(key: string, value: unknown) {
			this[key] = value;

			return this;
		}

		get(key: string) {
			return this[key];
		}

		initDimensions() {
			this.height = Number(this.fontSize) || 24;
		}

		isOnScreen() {
			return true;
		}

		setCoords() {
			return this;
		}

		on() {
			return this;
		}

		off() {
			return this;
		}

		fire() {
			return this;
		}
	}

	return { TextboxMock };
});

vi.mock('fabric', async (importOriginal) => {
	const actual = await importOriginal<typeof import('fabric')>();

	return {
		...actual,
		Textbox: TextboxMock,
	};
});

const {
	boxedCornerCursorStyle,
	boxedTextTop,
	installBoxedTextControls,
	resolveBoxedOuterHeight,
	resolveBoxedOuterWidth,
	textBlockFromFabric,
	textBlockToFabric,
} = await import('@/lib/fabric/textFabric');

describe('textFabric', () => {
	it('maps simple text without a box style', () => {
		const text = TextBlock.create(30, 40);
		const fabricText = textBlockToFabric(text, {
			layerId: 'layer-1',
			interactive: true,
		});

		expect(textBlockFromFabric(fabricText).box).toBeNull();
	});

	it('maps TextBlock to a fabric text object', () => {
		const text = TextBlock.create(30, 40);

		text.applyPatch({ angle: 15, content: 'Panel note' });

		const fabricText = textBlockToFabric(text, {
			layerId: 'layer-1',
			interactive: true,
		});

		expect(isPageText(fabricText)).toBe(true);
		expect(getTextId(fabricText)).toBe(text.id);
		expect(fabricText.get('objectType')).toBe(FABRIC_OBJECT_TYPE.Text);
		expect(fabricText.get('layerId')).toBe('layer-1');
		expect(fabricText.text).toBe('Panel note');
		expect(fabricText.left).toBe(30);
		expect(fabricText.top).toBe(40);
		expect(fabricText.angle).toBe(15);
		expect(fabricText.selectable).toBe(true);
		expect(fabricText.lockScalingY).toBe(true);
	});

	it('locks inactive layer texts', () => {
		const text = TextBlock.create(0, 0);
		const fabricText = textBlockToFabric(text, {
			layerId: 'other',
			interactive: false,
		});

		expect(fabricText.selectable).toBe(false);
		expect(fabricText.evented).toBe(false);
		expect(fabricText.lockMovementX).toBe(true);
		expect(fabricText.hasControls).toBe(false);
	});

	it('reads transform back from fabric', () => {
		const fabricText = {
			text: 'Edited',
			left: 8,
			top: 16,
			width: 180,
			fontSize: 28,
			angle: 33,
			fill: '#112233',
			fontWeight: 'bold',
			fontStyle: 'italic',
			underline: true,
			linethrough: false,
			styles: {
				0: {
					0: { fill: '#ff0000', fontWeight: 'bold' },
				},
			},
		} as unknown as PageTextObject;

		expect(textBlockFromFabric(fabricText)).toEqual({
			content: 'Edited',
			left: 8,
			top: 16,
			width: 180,
			fontSize: 28,
			fontFamily: 'Noto Sans',
			angle: 33,
			fill: '#112233',
			fontWeight: 'bold',
			fontStyle: 'italic',
			underline: true,
			linethrough: false,
			stroke: null,
			strokeWidth: 0,
			lineHeight: 1.16,
			textAlign: 'left',
			styles: {
				'0': {
					'0': { fill: '#ff0000', fontWeight: 'bold' },
				},
			},
			box: null,
		});
	});

	it('clears styles when fabric has none', () => {
		const fabricText = {
			text: 'Plain',
			left: 0,
			top: 0,
			width: 100,
			fontSize: 24,
			angle: 0,
			fill: '#000000',
			fontWeight: 'normal',
			fontStyle: 'normal',
			underline: false,
			linethrough: false,
			styles: {},
		} as unknown as PageTextObject;

		expect(textBlockFromFabric(fabricText).styles).toBeNull();
	});

	it('maps format props and char styles to fabric', () => {
		const text = TextBlock.create(5, 6);

		text.applyPatch({
			fontWeight: 'bold',
			fontStyle: 'italic',
			underline: true,
			linethrough: true,
			fill: '#abcdef',
			styles: {
				'0': {
					'0': { fill: '#ff0000', fontSize: 18 },
				},
			},
		});

		const fabricText = textBlockToFabric(text, {
			layerId: 'layer-1',
			interactive: true,
		});

		expect(fabricText.fontWeight).toBe('bold');
		expect(fabricText.fontStyle).toBe('italic');
		expect(fabricText.underline).toBe(true);
		expect(fabricText.linethrough).toBe(true);
		expect(fabricText.fill).toBe('#abcdef');
		expect(fabricText.styles).toEqual({
			0: {
				0: { fill: '#ff0000', fontSize: 18 },
			},
		});
	});

	it('normalizes numeric weight, oblique style and empty fill', () => {
		const fabricText = {
			text: 'Styled',
			left: 1,
			top: 2,
			width: 90,
			fontSize: 16,
			angle: 0,
			fill: '',
			fontWeight: 700,
			fontStyle: 'oblique',
			underline: false,
			linethrough: true,
			styles: {},
		} as unknown as PageTextObject;

		expect(textBlockFromFabric(fabricText)).toMatchObject({
			fill: '#000000',
			fontWeight: 'bold',
			fontStyle: 'italic',
			linethrough: true,
			styles: null,
		});
	});

	it('round-trips a formatted text block through fabric', () => {
		const text = TextBlock.create(12, 24);

		text.applyPatch({
			content: 'Hello',
			fontWeight: 'bold',
			fontStyle: 'italic',
			underline: true,
			styles: {
				'0': {
					'1': { fill: '#00ff00' },
				},
			},
		});

		const fabricText = textBlockToFabric(text, {
			layerId: 'layer-1',
			interactive: true,
		});
		const patch = textBlockFromFabric(fabricText);
		const restored = TextBlock.create(0, 0);

		restored.applyPatch(patch);

		expect(restored.content).toBe('Hello');
		expect(restored.fontWeight).toBe('bold');
		expect(restored.fontStyle).toBe('italic');
		expect(restored.underline).toBe(true);
		expect(restored.styles).toEqual({
			'0': {
				'1': { fill: '#00ff00' },
			},
		});
	});

	it('maps stroke props to and from fabric', () => {
		const text = TextBlock.create(0, 0);

		text.applyPatch({
			stroke: '#ff0000',
			strokeWidth: 3,
		});

		const fabricText = textBlockToFabric(text, {
			layerId: 'layer-1',
			interactive: true,
		});

		expect(fabricText.stroke).toBe('#ff0000');
		expect(fabricText.strokeWidth).toBe(3);
		expect(fabricText.paintFirst).toBe('stroke');
		expect(fabricText.strokeLineJoin).toBe('round');
		expect(fabricText.strokeLineCap).toBe('round');

		expect(textBlockFromFabric(fabricText)).toMatchObject({
			stroke: '#ff0000',
			strokeWidth: 3,
		});
	});

	it('maps textAlign to and from fabric', () => {
		const text = TextBlock.create(0, 0);

		text.applyPatch({ textAlign: 'center' });

		const fabricText = textBlockToFabric(text, {
			layerId: 'layer-1',
			interactive: true,
		});

		expect(fabricText.textAlign).toBe('center');
		expect(textBlockFromFabric(fabricText).textAlign).toBe('center');
	});

	it('maps lineHeight to and from fabric', () => {
		const text = TextBlock.create(0, 0);

		text.applyPatch({ lineHeight: 1.8 });

		const fabricText = textBlockToFabric(text, {
			layerId: 'layer-1',
			interactive: true,
		});

		expect(fabricText.lineHeight).toBe(1.8);
		expect(textBlockFromFabric(fabricText).lineHeight).toBe(1.8);
	});

	it('gives boxed text lateral resize controls (ml/mr)', async () => {
		const { Group } = await import('fabric');
		const rotate = { kind: 'rotate' };
		const group = Object.assign(new Group([], { objectCaching: false }), {
			controls: {
				tl: {},
				tr: {},
				ml: {},
				mr: {},
				mtr: rotate,
			},
		});

		installBoxedTextControls(group);

		expect(group.controls.ml).toBeDefined();
		expect(group.controls.mr).toBeDefined();
		expect(group.controls.mtr).toBe(rotate);
		expect(group.controls.ml?.actionName).toBe('resizing');
		expect(group.controls.mr?.actionName).toBe('resizing');
		expect(group.controls.mt?.actionName).toBe('resizing');
		expect(group.controls.mb?.actionName).toBe('resizing');
		expect(group.controls.tl?.actionName).toBe('scale');
		expect(group.controls.br?.actionName).toBe('scale');
	});

	it('maps boxed corner controls to diagonal resize cursors', () => {
		expect(boxedCornerCursorStyle(-0.5, -0.5, 0)).toBe('nw-resize');
		expect(boxedCornerCursorStyle(0.5, -0.5, 0)).toBe('ne-resize');
		expect(boxedCornerCursorStyle(-0.5, 0.5, 0)).toBe('sw-resize');
		expect(boxedCornerCursorStyle(0.5, 0.5, 0)).toBe('se-resize');
		expect(boxedCornerCursorStyle(0.5, 0.5, 90)).toBe('sw-resize');
	});

	it('computes vertical text top inside a taller box', () => {
		expect(resolveBoxedOuterHeight(120, 40, 12)).toBe(120);
		expect(resolveBoxedOuterHeight(20, 40, 12)).toBe(64);
		expect(boxedTextTop(120, 40, 12, 'top')).toBe(12);
		expect(boxedTextTop(120, 40, 12, 'middle')).toBe(40);
		expect(boxedTextTop(120, 40, 12, 'bottom')).toBe(68);
	});

	it('resolves boxed outer width from explicit box width', () => {
		expect(resolveBoxedOuterWidth(0, 200, 12)).toBe(224);
		expect(resolveBoxedOuterWidth(300, 200, 12)).toBe(300);
		// No puede quedar por debajo del texto + padding.
		expect(resolveBoxedOuterWidth(10, 200, 12)).toBe(224);
	});
});

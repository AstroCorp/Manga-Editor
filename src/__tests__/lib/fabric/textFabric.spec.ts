import { describe, expect, it, vi } from 'vitest';
import { Group, Rect } from 'fabric';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import { getTextId, isPageText } from '@/lib/fabric/isGuide';
import { TextBlock } from '@/models/TextBlock';
import type { PageTextObject } from '@/types/fabric';
import type { TextBoxStyle } from '@/types/page';

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

		/** Mínimo para que Group/LayoutManager pueda medir el Textbox mock. */
		getRelativeCenterPoint() {
			const left = Number(this.left) || 0;
			const top = Number(this.top) || 0;
			const width = Number(this.width) || 0;
			const height = Number(this.height) || 0;
			const strokeWidth = Number(this.strokeWidth) || 0;

			return {
				x: left + (width + strokeWidth) / 2,
				y: top + (height + strokeWidth) / 2,
				transform() {
					return this;
				},
			};
		}

		isStrokeAccountedForInDimensions() {
			return false;
		}

		calcTransformMatrix() {
			return [1, 0, 0, 1, 0, 0];
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
	boxedRectOrigin,
	boxedTextTop,
	getPageTextRect,
	getPageTextbox,
	installBoxedTextControls,
	resolveBoxedOuterHeight,
	resolveBoxedOuterWidth,
	syncBoxedTextGeometry,
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

	it('offsets boxed rect origin by half stroke to keep fill aligned with text', () => {
		expect(boxedRectOrigin(100, 0)).toBe(-50);
		expect(boxedRectOrigin(100, 5)).toBe(-52.5);
		expect(boxedRectOrigin(100, -2)).toBe(-50);
		expect(boxedRectOrigin(80, 2)).toBe(-41);

		// Con middle: centro del relleno = origin + stroke/2 + H/2 = 0.
		const outerHeight = 100;
		const stroke = 5;
		const textHeight = 24;
		const textTop = boxedTextTop(outerHeight, textHeight, 12, 'middle');
		const rectTop = boxedRectOrigin(outerHeight, stroke);
		const textboxTop = -outerHeight / 2 + textTop;
		const fillCenterY = rectTop + stroke / 2 + outerHeight / 2;
		const textCenterY = textboxTop + textHeight / 2;

		expect(fillCenterY).toBeCloseTo(0);
		expect(textCenterY).toBeCloseTo(0);
	});

	it('keeps equal padding gaps for top and bottom when stroke is compensated', () => {
		const outerHeight = 120;
		const stroke = 5;
		const textHeight = 40;
		const padding = 12;
		const rectTop = boxedRectOrigin(outerHeight, stroke);
		const fillTop = rectTop + stroke / 2;
		const fillBottom = fillTop + outerHeight;

		const topTextTop =
			-outerHeight / 2 +
			boxedTextTop(outerHeight, textHeight, padding, 'top');
		const bottomTextTop =
			-outerHeight / 2 +
			boxedTextTop(outerHeight, textHeight, padding, 'bottom');

		expect(topTextTop - fillTop).toBeCloseTo(padding);
		expect(fillBottom - (bottomTextTop + textHeight)).toBeCloseTo(padding);
	});

	it('syncBoxedTextGeometry centers text fill with strokeWidth > 0', () => {
		const stroke = 5;
		const outerWidth = 200;
		const outerHeight = 100;
		const padding = 12;
		const textHeight = 24;
		const box: TextBoxStyle = {
			fill: '#ffffff',
			stroke: '#000000',
			strokeWidth: stroke,
			cornerRadius: 8,
			padding,
			width: outerWidth,
			height: outerHeight,
			verticalAlign: 'middle',
		};
		const rect = new Rect({
			left: 0,
			top: 0,
			width: outerWidth,
			height: outerHeight,
			strokeWidth: stroke,
		});
		const textbox = new TextboxMock('Hi', {
			width: outerWidth - padding * 2,
			fontSize: textHeight,
			height: textHeight,
			left: 0,
			top: 0,
			strokeWidth: 0,
		});
		const group = new Group([], { objectCaching: false }) as PageTextObject;

		vi.spyOn(group, 'getObjects').mockReturnValue([rect, textbox as never]);

		syncBoxedTextGeometry(group, box);

		expect(rect.left).toBeCloseTo(boxedRectOrigin(outerWidth, stroke));
		expect(rect.top).toBeCloseTo(boxedRectOrigin(outerHeight, stroke));
		expect(getPageTextRect(group)).toBe(rect);
		expect(getPageTextbox(group)).toBe(textbox);

		const fillCenterY = Number(rect.top) + stroke / 2 + outerHeight / 2;
		const textCenterY = Number(textbox.top) + textHeight / 2;

		expect(fillCenterY).toBeCloseTo(0);
		expect(textCenterY).toBeCloseTo(0);
		expect(Number(textbox.top)).toBeCloseTo(
			-outerHeight / 2 +
				boxedTextTop(outerHeight, textHeight, padding, 'middle'),
		);
	});

	it('syncBoxedTextGeometry realigns after verticalAlign changes', () => {
		const stroke = 5;
		const outerWidth = 200;
		const outerHeight = 100;
		const padding = 12;
		const textHeight = 24;
		const rect = new Rect({
			width: outerWidth,
			height: outerHeight,
			strokeWidth: stroke,
		});
		const textbox = new TextboxMock('Hi', {
			width: outerWidth - padding * 2,
			fontSize: textHeight,
			height: textHeight,
			strokeWidth: 0,
		});
		const group = new Group([], { objectCaching: false }) as PageTextObject;

		vi.spyOn(group, 'getObjects').mockReturnValue([rect, textbox as never]);

		const baseBox: TextBoxStyle = {
			fill: '#ffffff',
			stroke: '#000000',
			strokeWidth: stroke,
			cornerRadius: 0,
			padding,
			width: outerWidth,
			height: outerHeight,
			verticalAlign: 'top',
		};

		syncBoxedTextGeometry(group, baseBox);

		expect(Number(textbox.top)).toBeCloseTo(-outerHeight / 2 + padding);
		expect(Number(rect.top)).toBeCloseTo(boxedRectOrigin(outerHeight, stroke));

		syncBoxedTextGeometry(group, {
			...baseBox,
			verticalAlign: 'bottom',
		});

		expect(Number(textbox.top)).toBeCloseTo(
			-outerHeight / 2 +
				boxedTextTop(outerHeight, textHeight, padding, 'bottom'),
		);
		expect(Number(rect.top)).toBeCloseTo(boxedRectOrigin(outerHeight, stroke));
	});

	it('resolves boxed outer width from explicit box width', () => {
		expect(resolveBoxedOuterWidth(0, 200, 12)).toBe(224);
		expect(resolveBoxedOuterWidth(300, 200, 12)).toBe(300);
		// No puede quedar por debajo del texto + padding.
		expect(resolveBoxedOuterWidth(10, 200, 12)).toBe(224);
	});
});

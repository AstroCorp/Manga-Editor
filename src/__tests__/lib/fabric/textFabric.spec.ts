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

		get(key: string) {
			return this[key];
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

const { textBlockFromFabric, textBlockToFabric } = await import(
	'@/lib/fabric/textFabric'
);

describe('textFabric', () => {
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
			fontFamily: 'Roboto',
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
});

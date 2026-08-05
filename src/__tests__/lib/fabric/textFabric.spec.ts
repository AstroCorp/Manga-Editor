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
		} as unknown as PageTextObject;

		expect(textBlockFromFabric(fabricText)).toEqual({
			content: 'Edited',
			left: 8,
			top: 16,
			width: 180,
			fontSize: 28,
			angle: 33,
		});
	});
});

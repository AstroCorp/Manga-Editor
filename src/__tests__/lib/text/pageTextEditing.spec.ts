import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import * as textFabric from '@/lib/fabric/textFabric';
import {
	applyEditingTextareaKey,
	exitOrphanPageTextEditing,
	findEditingPageText,
	isHostedTextEditing,
	resolveEditingTextbox,
} from '@/lib/text/pageTextEditing';
import type { Canvas, FabricObject } from 'fabric';

const createTextHost = () => {
	return {
		get: (key: string) => {
			if (key === 'objectType') {
				return FABRIC_OBJECT_TYPE.Text;
			}

			return undefined;
		},
	} as unknown as FabricObject;
};

const createTextarea = (value: string, start: number, end = start) => {
	const textarea = document.createElement('textarea');

	textarea.value = value;

	const setRange = (nextStart: number, nextEnd: number) => {
		Object.defineProperty(textarea, 'selectionStart', {
			configurable: true,
			writable: true,
			value: nextStart,
		});
		Object.defineProperty(textarea, 'selectionEnd', {
			configurable: true,
			writable: true,
			value: nextEnd,
		});
	};

	textarea.setSelectionRange = ((nextStart: number, nextEnd: number) => {
		setRange(nextStart, nextEnd);
	}) as typeof textarea.setSelectionRange;

	setRange(start, end);

	return textarea;
};

describe('applyEditingTextareaKey', () => {
	it('removes the previous character with Backspace', () => {
		const textarea = createTextarea('Hello', 5);

		expect(
			applyEditingTextareaKey(textarea, {
				key: 'Backspace',
				ctrlKey: false,
				metaKey: false,
				altKey: false,
			}),
		).toBe('changed');
		expect(textarea.value).toBe('Hell');
	});

	it('removes the next character with Delete', () => {
		const textarea = createTextarea('Hell', 1);

		expect(
			applyEditingTextareaKey(textarea, {
				key: 'Delete',
				ctrlKey: false,
				metaKey: false,
				altKey: false,
			}),
		).toBe('changed');
		expect(textarea.value).toBe('Hll');
	});

	it('removes a selected range', () => {
		const textarea = createTextarea('abcdef', 2, 4);

		expect(
			applyEditingTextareaKey(textarea, {
				key: 'Backspace',
				ctrlKey: false,
				metaKey: false,
				altKey: false,
			}),
		).toBe('changed');
		expect(textarea.value).toBe('abef');
	});

	it('inserts printable characters', () => {
		const textarea = createTextarea('Hi', 2);

		expect(
			applyEditingTextareaKey(textarea, {
				key: '!',
				ctrlKey: false,
				metaKey: false,
				altKey: false,
			}),
		).toBe('changed');
		expect(textarea.value).toBe('Hi!');
	});

	it('signals selectAll for Ctrl/Cmd+A', () => {
		const textarea = createTextarea('Hi', 0);

		expect(
			applyEditingTextareaKey(textarea, {
				key: 'a',
				ctrlKey: true,
				metaKey: false,
				altKey: false,
			}),
		).toBe('selectAll');
	});

	it('ignores navigation keys', () => {
		const textarea = createTextarea('Hi', 1);

		expect(
			applyEditingTextareaKey(textarea, {
				key: 'ArrowLeft',
				ctrlKey: false,
				metaKey: false,
				altKey: false,
			}),
		).toBe('ignored');
		expect(textarea.value).toBe('Hi');
	});
});

describe('pageTextEditing canvas helpers', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('finds the editing textbox on the canvas', () => {
		const host = createTextHost();
		const textbox = { isEditing: true };

		vi.spyOn(textFabric, 'getPageTextbox').mockReturnValue(textbox as never);

		const canvas = {
			getObjects: () => {
				return [host];
			},
		} as unknown as Canvas;

		expect(findEditingPageText(canvas)).toEqual({
			pageText: host,
			textbox,
		});
		expect(findEditingPageText(null)).toBeNull();
	});

	it('resolves null for non-text targets', () => {
		const other = {
			get: () => {
				return 'panel';
			},
		} as unknown as FabricObject;

		expect(resolveEditingTextbox(other)).toBeNull();
		expect(resolveEditingTextbox(null)).toBeNull();
	});

	it('exits orphan editing when the host is no longer active', () => {
		const host = createTextHost();
		const exitEditing = vi.fn();
		const textbox = { isEditing: true, exitEditing };

		vi.spyOn(textFabric, 'getPageTextbox').mockReturnValue(textbox as never);

		const canvas = {
			getObjects: () => {
				return [host];
			},
		} as unknown as Canvas;

		exitOrphanPageTextEditing(canvas, null);
		expect(exitEditing).toHaveBeenCalledOnce();

		exitEditing.mockClear();
		exitOrphanPageTextEditing(canvas, host);
		expect(exitEditing).not.toHaveBeenCalled();
	});

	it('detects hosted editing when the active object is not the textbox', () => {
		const pageText = createTextHost();
		const textbox = { isEditing: true } as never;

		expect(isHostedTextEditing(pageText, { pageText, textbox })).toBe(true);
		expect(isHostedTextEditing(textbox, { pageText, textbox })).toBe(false);
	});
});

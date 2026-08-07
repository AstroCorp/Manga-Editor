import { describe, expect, it, beforeEach } from 'vitest';
import { clearClipboard } from '@/lib/clipboard/editorClipboard';
import {
	cloneTextBlockAt,
	copyTextToClipboard,
	peekCopiedText,
} from '@/lib/text/textClipboard';
import { TextBlock } from '@/models/TextBlock';

describe('textClipboard', () => {
	beforeEach(() => {
		clearClipboard();
	});

	it('stores a deep snapshot of the copied text', () => {
		const text = TextBlock.create(10, 20);

		text.applyPatch({ content: 'Hello', fontSize: 32 });
		copyTextToClipboard(text.toJSON());

		const peeked = peekCopiedText();

		expect(peeked?.content).toBe('Hello');
		expect(peeked?.fontSize).toBe(32);
		expect(peeked?.id).toBe(text.id);

		text.applyPatch({ content: 'Changed' });
		expect(peekCopiedText()?.content).toBe('Hello');
	});

	it('clones with a new id at the target origin', () => {
		const source = TextBlock.create(1, 2);

		source.applyPatch({ content: 'Clone me', angle: 15 });

		const clone = cloneTextBlockAt(source, 100, 200);

		expect(clone.id).not.toBe(source.id);
		expect(clone.content).toBe('Clone me');
		expect(clone.angle).toBe(15);
		expect(clone.left).toBe(100);
		expect(clone.top).toBe(200);
	});
});

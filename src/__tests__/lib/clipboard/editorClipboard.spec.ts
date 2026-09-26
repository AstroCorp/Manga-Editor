import { describe, expect, it, beforeEach } from 'vitest';
import {
	clearClipboard,
	peekClipboardEntryOfKind,
	setClipboardEntry,
} from '@/lib/clipboard/editorClipboard';
import { TextBlock } from '@/models/TextBlock';

describe('editorClipboard', () => {
	beforeEach(() => {
		clearClipboard();
	});

	it('stores typed entries and peeks by kind', () => {
		const text = TextBlock.create(10, 20);

		expect(peekClipboardEntryOfKind('text')).toBeNull();

		setClipboardEntry({
			kind: 'text',
			payload: text.toJSON(),
		});

		expect(peekClipboardEntryOfKind('text')?.payload.id).toBe(text.id);
	});
});

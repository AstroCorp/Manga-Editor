import { createId } from '@/lib/id';
import { setClipboardEntry, peekClipboardEntryOfKind } from '@/lib/clipboard/editorClipboard';
import { TextBlock } from '@/models/TextBlock';
import type { TextBlockJSON } from '@/types/page';

export const copyTextToClipboard = (snapshot: TextBlockJSON) => {
	setClipboardEntry({
		kind: 'text',
		payload: snapshot,
	});
};

export const peekCopiedText = (): TextBlockJSON | null => {
	return peekClipboardEntryOfKind('text')?.payload ?? null;
};

export const cloneTextBlockAt = (
	source: TextBlockJSON | TextBlock,
	left: number,
	top: number,
): TextBlock => {
	const json = source instanceof TextBlock ? source.toJSON() : source;

	return TextBlock.fromJSON({
		...json,
		id: createId(),
		left,
		top,
	});
};

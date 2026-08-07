import type { TextBlockJSON } from '@/types/page';

type TextClipboardEntry = {
	kind: 'text';
	payload: TextBlockJSON;
};

export type ClipboardEntry = TextClipboardEntry;

export type ClipboardEntryKind = ClipboardEntry['kind'];

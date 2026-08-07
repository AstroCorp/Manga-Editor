import type { TextBlockJSON } from '@/types/page';

export type TextClipboardEntry = {
	kind: 'text';
	payload: TextBlockJSON;
};

export type ClipboardEntry = TextClipboardEntry;

export type ClipboardEntryKind = ClipboardEntry['kind'];

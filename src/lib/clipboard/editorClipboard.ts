import type {
	ClipboardEntry,
	ClipboardEntryKind,
} from '@/types/clipboard';

let clipboard: ClipboardEntry | null = null;

export const setClipboardEntry = (entry: ClipboardEntry) => {
	clipboard = structuredClone(entry);
};

export const peekClipboardEntry = (): ClipboardEntry | null => {
	return clipboard;
};

export const peekClipboardEntryOfKind = <K extends ClipboardEntryKind>(
	kind: K,
): Extract<ClipboardEntry, { kind: K }> | null => {
	if (!clipboard || clipboard.kind !== kind) {
		return null;
	}

	return clipboard as Extract<ClipboardEntry, { kind: K }>;
};

export const hasClipboardKind = (kind: ClipboardEntryKind): boolean => {
	return clipboard?.kind === kind;
};

export const clearClipboard = () => {
	clipboard = null;
};

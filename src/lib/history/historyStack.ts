import { createId } from '@/lib/id';
import { HISTORY_LABEL, MAX_HISTORY_MOVEMENTS } from '@/lib/history/historyEnums';
import { isSameDocument } from '@/lib/history/documentSnapshot';
import type {
	HistoryDocumentJSON,
	HistoryEntry,
	HistoryListItem,
	HistoryStackState,
} from '@/types/history';

const MAX_HISTORY_ENTRIES = MAX_HISTORY_MOVEMENTS + 1;

export const createHistoryState = (
	snapshot: HistoryDocumentJSON,
): HistoryStackState => {
	return {
		entries: [
			{
				id: createId(),
				label: HISTORY_LABEL.Start,
				snapshot,
			},
		],
		index: 0,
	};
};

export const pushMovement = (
	state: HistoryStackState,
	label: string,
	snapshot: HistoryDocumentJSON,
): HistoryStackState => {
	const current = state.entries[state.index];

	if (current && isSameDocument(current.snapshot, snapshot)) {
		return state;
	}

	const kept = state.entries.slice(0, state.index + 1);

	kept.push({
		id: createId(),
		label,
		snapshot,
	});

	const entries =
		kept.length > MAX_HISTORY_ENTRIES
			? kept.slice(kept.length - MAX_HISTORY_ENTRIES)
			: kept;

	return {
		entries,
		index: entries.length - 1,
	};
};

export const canUndoHistory = (state: HistoryStackState): boolean => {
	return state.index > 0;
};

export const canRedoHistory = (state: HistoryStackState): boolean => {
	return state.index < state.entries.length - 1;
};

export const stepHistoryIndex = (
	state: HistoryStackState,
	delta: number,
): { state: HistoryStackState; snapshot: HistoryDocumentJSON } | null => {
	const nextIndex = state.index + delta;

	if (nextIndex < 0 || nextIndex >= state.entries.length) {
		return null;
	}

	const entry = state.entries[nextIndex];

	if (!entry) {
		return null;
	}

	return {
		state: {
			entries: state.entries,
			index: nextIndex,
		},
		snapshot: entry.snapshot,
	};
};

export const jumpHistoryIndex = (
	state: HistoryStackState,
	entryId: string,
): { state: HistoryStackState; snapshot: HistoryDocumentJSON } | null => {
	const nextIndex = state.entries.findIndex((entry) => {
		return entry.id === entryId;
	});

	if (nextIndex < 0 || nextIndex === state.index) {
		return null;
	}

	const entry = state.entries[nextIndex];

	if (!entry) {
		return null;
	}

	return {
		state: {
			entries: state.entries,
			index: nextIndex,
		},
		snapshot: entry.snapshot,
	};
};

/** Más reciente primero, para el desplegable de la topbar. */
export const listHistoryItems = (
	entries: ReadonlyArray<HistoryEntry>,
	index: number,
): HistoryListItem[] => {
	return [...entries].reverse().map((entry, reversedIndex) => {
		const entryIndex = entries.length - 1 - reversedIndex;

		return {
			id: entry.id,
			label: entry.label,
			isCurrent: entryIndex === index,
			isFuture: entryIndex > index,
		};
	});
};

import {
	applyPatches,
	enablePatches,
	produceWithPatches,
	setAutoFreeze,
} from 'immer';
import { createId } from '@/lib/id';
import { assignPlain } from '@/lib/history/assignPlain';
import { HISTORY_LABEL, MAX_HISTORY_MOVEMENTS } from '@/lib/history/historyEnums';
import type {
	HistoryDocumentJSON,
	HistoryEntry,
	HistoryListItem,
	HistoryStackState,
	PersistedHistoryStack,
} from '@/types/history';

enablePatches();
setAutoFreeze(false);

const MAX_HISTORY_ENTRIES = MAX_HISTORY_MOVEMENTS + 1;

const emptyEntry = (label: string): HistoryEntry => {
	return {
		id: createId(),
		label,
		patches: [],
		inversePatches: [],
	};
};

const documentAtIndex = (
	baseline: HistoryDocumentJSON,
	entries: ReadonlyArray<HistoryEntry>,
	index: number,
): HistoryDocumentJSON => {
	let document = baseline;

	for (let entryIndex = 1; entryIndex <= index; entryIndex += 1) {
		const patches = entries[entryIndex]?.patches;

		if (patches && patches.length > 0) {
			document = applyPatches(document, patches);
		}
	}

	return document;
};

export const toPersistedHistory = (
	state: HistoryStackState,
): PersistedHistoryStack => {
	return {
		baseline: state.baseline,
		entries: state.entries,
		index: state.index,
	};
};

export const fromPersistedHistory = (
	persisted: PersistedHistoryStack,
): HistoryStackState => {
	return {
		baseline: persisted.baseline,
		entries: persisted.entries,
		index: persisted.index,
		current: documentAtIndex(
			persisted.baseline,
			persisted.entries,
			persisted.index,
		),
	};
};

export const createHistoryState = (
	snapshot: HistoryDocumentJSON,
): HistoryStackState => {
	return {
		baseline: snapshot,
		current: snapshot,
		entries: [emptyEntry(HISTORY_LABEL.Start)],
		index: 0,
	};
};

const diffDocuments = (
	from: HistoryDocumentJSON,
	to: HistoryDocumentJSON,
) => {
	return produceWithPatches(from, (draft) => {
		assignPlain(draft, to);
	});
};

export const dropOldestMovement = (
	state: HistoryStackState,
): HistoryStackState | null => {
	if (state.entries.length <= 1) {
		return null;
	}

	const nextHead = state.entries[1]!;
	const baseline =
		nextHead.patches.length > 0
			? applyPatches(state.baseline, nextHead.patches)
			: state.baseline;

	return {
		baseline,
		current: state.current,
		entries: [
			{
				...nextHead,
				patches: [],
				inversePatches: [],
			},
			...state.entries.slice(2),
		],
		index: Math.max(0, state.index - 1),
	};
};

export const pushMovement = (
	state: HistoryStackState,
	label: string,
	snapshot: HistoryDocumentJSON,
): HistoryStackState => {
	const [next, patches, inversePatches] = diffDocuments(
		state.current,
		snapshot,
	);

	if (patches.length === 0) {
		return state;
	}

	const kept = state.entries.slice(0, state.index + 1);

	kept.push({
		id: createId(),
		label,
		patches,
		inversePatches,
	});

	let nextState: HistoryStackState = {
		baseline: state.baseline,
		current: next,
		entries: kept,
		index: kept.length - 1,
	};

	while (nextState.entries.length > MAX_HISTORY_ENTRIES) {
		const trimmed = dropOldestMovement(nextState);

		if (!trimmed) {
			break;
		}

		nextState = trimmed;
	}

	return nextState;
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

	const current =
		delta < 0
			? applyPatches(
					state.current,
					state.entries[state.index]!.inversePatches,
				)
			: applyPatches(state.current, state.entries[nextIndex]!.patches);

	const nextState: HistoryStackState = {
		baseline: state.baseline,
		current,
		entries: state.entries,
		index: nextIndex,
	};

	return {
		state: nextState,
		snapshot: current,
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

	const current = documentAtIndex(state.baseline, state.entries, nextIndex);
	const nextState: HistoryStackState = {
		baseline: state.baseline,
		current,
		entries: state.entries,
		index: nextIndex,
	};

	return {
		state: nextState,
		snapshot: current,
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

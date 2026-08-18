import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
	canRedoHistory,
	canUndoHistory,
	createHistoryState,
	jumpHistoryIndex,
	listHistoryItems,
	pushMovement,
	stepHistoryIndex,
} from '@/lib/history/historyStack';
import type { HistoryDocumentJSON, HistoryStackState } from '@/types/history';

const emptyState = (): HistoryStackState => {
	return {
		entries: [],
		index: -1,
	};
};

export const useHistoryStore = defineStore('history', () => {
	const stack = ref<HistoryStackState>(emptyState());

	const entries = computed(() => {
		return stack.value.entries;
	});

	const currentLabel = computed(() => {
		return stack.value.entries[stack.value.index]?.label ?? '';
	});

	const canUndo = computed(() => {
		return canUndoHistory(stack.value);
	});

	const canRedo = computed(() => {
		return canRedoHistory(stack.value);
	});

	const items = computed(() => {
		return listHistoryItems(stack.value.entries, stack.value.index);
	});

	const resetWith = (snapshot: HistoryDocumentJSON) => {
		stack.value = createHistoryState(snapshot);
	};

	const push = (label: string, snapshot: HistoryDocumentJSON) => {
		stack.value = pushMovement(stack.value, label, snapshot);
	};

	const stepBack = (): HistoryDocumentJSON | null => {
		const next = stepHistoryIndex(stack.value, -1);

		if (!next) {
			return null;
		}

		stack.value = next.state;

		return next.snapshot;
	};

	const stepForward = (): HistoryDocumentJSON | null => {
		const next = stepHistoryIndex(stack.value, 1);

		if (!next) {
			return null;
		}

		stack.value = next.state;

		return next.snapshot;
	};

	const jumpTo = (entryId: string): HistoryDocumentJSON | null => {
		const next = jumpHistoryIndex(stack.value, entryId);

		if (!next) {
			return null;
		}

		stack.value = next.state;

		return next.snapshot;
	};

	const hydrate = (next: HistoryStackState) => {
		stack.value = {
			entries: next.entries,
			index: next.index,
		};
	};

	const getStack = (): HistoryStackState => {
		return stack.value;
	};

	return {
		entries,
		currentLabel,
		canUndo,
		canRedo,
		items,
		resetWith,
		push,
		stepBack,
		stepForward,
		jumpTo,
		hydrate,
		getStack,
	};
});

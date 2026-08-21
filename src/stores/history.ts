import { computed, shallowRef } from 'vue';
import { defineStore } from 'pinia';
import {
	canRedoHistory,
	canUndoHistory,
	createHistoryState,
	fromPersistedHistory,
	jumpHistoryIndex,
	listHistoryItems,
	pushMovement,
	stepHistoryIndex,
	toPersistedHistory,
} from '@/lib/history/historyStack';
import {
	collectAssetIdsFromHistory,
	createImageAssetStore,
} from '@/lib/history/imageAssets';
import type {
	HistoryDocumentJSON,
	HistoryStackState,
	ImageAssetMap,
	InternImageSrc,
	PersistedHistoryStack,
	ResolveImageAsset,
} from '@/types/history';

const emptyState = (): HistoryStackState => {
	return {
		baseline: {
			title: '',
			activePageId: '',
			pages: [],
		},
		current: {
			title: '',
			activePageId: '',
			pages: [],
		},
		entries: [],
		index: -1,
	};
};

export const useHistoryStore = defineStore('history', () => {
	const stack = shallowRef<HistoryStackState>(emptyState());
	const assets = createImageAssetStore();

	const retainUsedImages = () => {
		assets.retain(collectAssetIdsFromHistory(stack.value));
	};

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

	const internImage: InternImageSrc = (src) => {
		return assets.intern(src);
	};

	const resolveImage: ResolveImageAsset = (assetId) => {
		return assets.resolve(assetId);
	};

	const importImages = (images: ImageAssetMap) => {
		assets.hydrate(images);
	};

	const exportImages = (): ImageAssetMap => {
		return assets.exportAll();
	};

	const resetWith = (snapshot: HistoryDocumentJSON) => {
		stack.value = createHistoryState(snapshot);
		retainUsedImages();
	};

	const push = (label: string, snapshot: HistoryDocumentJSON) => {
		stack.value = pushMovement(stack.value, label, snapshot);
		retainUsedImages();
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

	const hydrate = (next: PersistedHistoryStack) => {
		stack.value = fromPersistedHistory(next);
		retainUsedImages();
	};

	const getStack = (): PersistedHistoryStack => {
		return toPersistedHistory(stack.value);
	};

	return {
		entries,
		currentLabel,
		canUndo,
		canRedo,
		items,
		internImage,
		resolveImage,
		importImages,
		exportImages,
		resetWith,
		push,
		stepBack,
		stepForward,
		jumpTo,
		hydrate,
		getStack,
	};
});

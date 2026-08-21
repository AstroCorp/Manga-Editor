import { createId } from '@/lib/id';
import type { Patch } from 'immer';
import type {
	HistoryAssetScanInput,
	HistoryDocumentJSON,
	ImageAssetStore,
	InternImageSrc,
	PersistedHistoryStack,
	ResolveImageAsset,
} from '@/types/history';

export const createImageAssetStore = (): ImageAssetStore => {
	const byId = new Map<string, string>();
	const bySrc = new Map<string, string>();

	const intern: InternImageSrc = (src) => {
		const existing = bySrc.get(src);

		if (existing) {
			return existing;
		}

		const assetId = createId();

		bySrc.set(src, assetId);
		byId.set(assetId, src);

		return assetId;
	};

	const resolve: ResolveImageAsset = (assetId) => {
		const src = byId.get(assetId);

		if (!src) {
			throw new Error(`Missing image asset: ${assetId}`);
		}

		return src;
	};

	const exportAll = (): Record<string, string> => {
		return Object.fromEntries(byId);
	};

	const hydrate = (images: Record<string, string>) => {
		byId.clear();
		bySrc.clear();

		Object.entries(images).forEach(([assetId, src]) => {
			byId.set(assetId, src);
			bySrc.set(src, assetId);
		});
	};

	const retain = (usedIds: Iterable<string>) => {
		const keep = new Set(usedIds);

		[...byId.keys()].forEach((assetId) => {
			if (keep.has(assetId)) {
				return;
			}

			const src = byId.get(assetId);

			byId.delete(assetId);

			if (src) {
				bySrc.delete(src);
			}
		});
	};

	return {
		intern,
		resolve,
		exportAll,
		hydrate,
		retain,
	};
};

const visitAssetIds = (value: unknown, into: Set<string>) => {
	if (!value || typeof value !== 'object') {
		return;
	}

	if (Array.isArray(value)) {
		value.forEach((item) => {
			visitAssetIds(item, into);
		});

		return;
	}

	const record = value as Record<string, unknown>;

	if (typeof record.assetId === 'string') {
		into.add(record.assetId);
	}

	Object.values(record).forEach((item) => {
		visitAssetIds(item, into);
	});
};

const visitPatchAssetIds = (patch: Patch, into: Set<string>) => {
	const last = patch.path[patch.path.length - 1];

	if (last === 'assetId' && typeof patch.value === 'string') {
		into.add(patch.value);
	}

	visitAssetIds(patch.value, into);
};

const collectAssetIdsFromDocument = (
	document: HistoryDocumentJSON,
): Set<string> => {
	const ids = new Set<string>();

	visitAssetIds(document, ids);

	return ids;
};

export const collectAssetIdsFromHistory = (
	input: HistoryAssetScanInput,
): Set<string> => {
	const ids = collectAssetIdsFromDocument(input.baseline);

	if (input.current) {
		visitAssetIds(input.current, ids);
	}

	input.entries.forEach((entry) => {
		entry.patches.forEach((patch) => {
			visitPatchAssetIds(patch, ids);
		});
		entry.inversePatches.forEach((patch) => {
			visitPatchAssetIds(patch, ids);
		});
	});

	return ids;
};

export const collectAssetIdsFromPersistedHistory = (
	history: PersistedHistoryStack,
	document: HistoryDocumentJSON,
): Set<string> => {
	const ids = collectAssetIdsFromHistory({
		baseline: history.baseline,
		entries: history.entries,
	});

	visitAssetIds(document, ids);

	return ids;
};

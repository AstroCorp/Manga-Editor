import type { ImageAssetMap } from '@/types/history';

const DATABASE_NAME = 'manga-editor';
const DATABASE_VERSION = 1;
const ASSET_STORE = 'image-assets';

let databasePromise: Promise<IDBDatabase> | null = null;

type StoredImageAsset = {
	mimeType: string;
	bytes: ArrayBuffer;
};

const requestResult = <T>(request: IDBRequest<T>): Promise<T> => {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => {
			resolve(request.result);
		};
		request.onerror = () => {
			reject(request.error ?? new Error('IndexedDB request failed'));
		};
	});
};

const transactionDone = (transaction: IDBTransaction): Promise<void> => {
	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => {
			resolve();
		};
		transaction.onerror = () => {
			reject(transaction.error ?? new Error('IndexedDB transaction failed'));
		};
		transaction.onabort = () => {
			reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
		};
	});
};

const openDatabase = (): Promise<IDBDatabase> => {
	if (databasePromise) {
		return databasePromise;
	}

	databasePromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

		request.onupgradeneeded = () => {
			if (!request.result.objectStoreNames.contains(ASSET_STORE)) {
				request.result.createObjectStore(ASSET_STORE);
			}
		};
		request.onsuccess = () => {
			const database = request.result;

			database.onversionchange = () => {
				database.close();
				databasePromise = null;
			};
			resolve(database);
		};
		request.onerror = () => {
			databasePromise = null;
			reject(request.error ?? new Error('Could not open image database'));
		};
		request.onblocked = () => {
			databasePromise = null;
			reject(new Error('Image database is blocked'));
		};
	});

	return databasePromise;
};

const dataUrlToStoredAsset = (dataUrl: string): StoredImageAsset => {
	const separator = dataUrl.indexOf(',');

	if (separator < 0 || !dataUrl.startsWith('data:')) {
		throw new Error('Image asset is not a data URL');
	}

	const metadata = dataUrl.slice(5, separator);
	const encoded = dataUrl.slice(separator + 1);
	const parts = metadata.split(';');
	const mimeType = parts[0] || 'application/octet-stream';
	const isBase64 = parts.includes('base64');
	const decoded = isBase64 ? atob(encoded) : decodeURIComponent(encoded);
	const bytes = new Uint8Array(decoded.length);

	for (let index = 0; index < decoded.length; index += 1) {
		bytes[index] = decoded.charCodeAt(index);
	}

	return {
		mimeType,
		bytes: bytes.buffer,
	};
};

const blobToDataUrl = (blob: Blob): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);

				return;
			}

			reject(new Error('Could not read image asset'));
		};
		reader.onerror = () => {
			reject(reader.error ?? new Error('Could not read image asset'));
		};
		reader.readAsDataURL(blob);
	});
};

export const saveImageAssets = async (
	images: ImageAssetMap,
	usedIds: ReadonlySet<string>,
): Promise<void> => {
	const database = await openDatabase();
	const lookup = database.transaction(ASSET_STORE, 'readonly');
	const existingKeys = await requestResult(
		lookup.objectStore(ASSET_STORE).getAllKeys(),
	);
	await transactionDone(lookup);

	const existing = new Set(existingKeys.map(String));
	const missing = [...usedIds].filter((assetId) => {
		return !existing.has(assetId);
	});

	if (missing.length === 0) {
		return;
	}

	const records = missing.map((assetId) => {
		const src = images[assetId];

		if (!src) {
			throw new Error(`Missing image source: ${assetId}`);
		}

		return [assetId, dataUrlToStoredAsset(src)] as const;
	});
	const transaction = database.transaction(ASSET_STORE, 'readwrite');
	const store = transaction.objectStore(ASSET_STORE);

	records.forEach(([assetId, record]) => {
		store.put(record, assetId);
	});

	await transactionDone(transaction);
};

export const loadImageAssets = async (
	assetIds: Iterable<string>,
): Promise<ImageAssetMap> => {
	const ids = [...new Set(assetIds)];

	if (ids.length === 0) {
		return {};
	}

	const database = await openDatabase();
	const transaction = database.transaction(ASSET_STORE, 'readonly');
	const store = transaction.objectStore(ASSET_STORE);
	const records = await Promise.all(
		ids.map((assetId) => {
			return requestResult(
				store.get(assetId) as IDBRequest<StoredImageAsset | undefined>,
			);
		}),
	);
	await transactionDone(transaction);

	const images: ImageAssetMap = {};

	await Promise.all(
		ids.map(async (assetId, index) => {
			const record = records[index];

			if (!record) {
				throw new Error(`Missing image asset: ${assetId}`);
			}

			images[assetId] = await blobToDataUrl(
				new Blob([record.bytes], { type: record.mimeType }),
			);
		}),
	);

	return images;
};

export const deleteImageAssetsExcept = async (
	usedIds: ReadonlySet<string>,
): Promise<void> => {
	const database = await openDatabase();
	const lookup = database.transaction(ASSET_STORE, 'readonly');
	const keys = await requestResult(lookup.objectStore(ASSET_STORE).getAllKeys());
	await transactionDone(lookup);

	const stale = keys.filter((key) => {
		return !usedIds.has(String(key));
	});

	if (stale.length === 0) {
		return;
	}

	const transaction = database.transaction(ASSET_STORE, 'readwrite');
	const store = transaction.objectStore(ASSET_STORE);

	stale.forEach((key) => {
		store.delete(key);
	});

	await transactionDone(transaction);
};

export const deleteImageAssetDatabase = async (): Promise<void> => {
	const database = databasePromise ? await databasePromise.catch(() => null) : null;

	database?.close();
	databasePromise = null;

	await new Promise<void>((resolve, reject) => {
		const request = indexedDB.deleteDatabase(DATABASE_NAME);

		request.onsuccess = () => {
			resolve();
		};
		request.onerror = () => {
			reject(request.error ?? new Error('Could not delete image database'));
		};
		request.onblocked = () => {
			reject(new Error('Image database deletion is blocked'));
		};
	});
};

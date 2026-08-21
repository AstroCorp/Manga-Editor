import 'fake-indexeddb/auto';
import { beforeEach } from 'vitest';
import { deleteImageAssetDatabase } from '@/lib/history/imageAssetDb';
import { PROJECT_STORAGE_KEY } from '@/lib/history/projectStorage';

beforeEach(async () => {
	localStorage.removeItem(PROJECT_STORAGE_KEY);
	await deleteImageAssetDatabase();
});

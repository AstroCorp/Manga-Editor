import { beforeEach } from 'vitest';
import { PROJECT_STORAGE_KEY } from '@/lib/history/projectStorage';

beforeEach(() => {
	localStorage.removeItem(PROJECT_STORAGE_KEY);
});

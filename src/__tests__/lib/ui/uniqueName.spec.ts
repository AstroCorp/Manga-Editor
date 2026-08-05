import { describe, it, expect } from 'vitest';
import {
	findUniqueName,
	isDuplicateName,
	normalizeNameKey,
} from '@/lib/ui/uniqueName';

describe('uniqueName', () => {
	it('normalizes for case-insensitive comparison', () => {
		expect(normalizeNameKey('  Cover  ')).toBe('cover');
	});

	it('detects duplicates ignoring case and self-name', () => {
		expect(isDuplicateName('Cover', ['Intro', 'Cover'])).toBe(true);
		expect(isDuplicateName('cover', ['Intro', 'Cover'])).toBe(true);
		expect(isDuplicateName('Cover', ['Intro', 'Cover'], 'Cover')).toBe(
			false,
		);
		expect(isDuplicateName('  ', ['Intro'])).toBe(true);
	});

	it('findUniqueName appends a numeric suffix when needed', () => {
		expect(findUniqueName('Page 2', ['Page 1'])).toBe('Page 2');
		expect(findUniqueName('Page 2', ['Page 1', 'Page 2'])).toBe('Page 2 (2)');
		expect(
			findUniqueName('Layer 1', ['Layer 1', 'Layer 1 (2)']),
		).toBe('Layer 1 (3)');
	});
});

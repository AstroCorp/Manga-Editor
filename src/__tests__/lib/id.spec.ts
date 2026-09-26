import { describe, expect, it } from 'vitest';
import { createId } from '@/lib/id';

describe('createId', () => {
	it('returns a unique uuid', () => {
		const first = createId();
		const second = createId();

		expect(first).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		);
		expect(second).not.toBe(first);
	});
});

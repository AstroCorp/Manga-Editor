import { describe, expect, it, vi } from 'vitest';
import { createConfirmPayload } from '@/lib/ui/createConfirmPayload';

describe('createConfirmPayload', () => {
	it('stores a pending payload until confirm', () => {
		const { pending, request, confirm } = createConfirmPayload<string>();
		const run = vi.fn();

		request('page-1');
		expect(pending.value).toBe('page-1');

		confirm(run);

		expect(pending.value).toBeNull();
		expect(run).toHaveBeenCalledExactlyOnceWith('page-1');
	});

	it('cancel clears pending without running', () => {
		const { pending, request, cancel, confirm } = createConfirmPayload<number>();
		const run = vi.fn();

		request(3);
		cancel();

		expect(pending.value).toBeNull();

		confirm(run);
		expect(run).not.toHaveBeenCalled();
	});

	it('confirm without pending is a no-op', () => {
		const { confirm } = createConfirmPayload<boolean>();
		const run = vi.fn();

		confirm(run);
		expect(run).not.toHaveBeenCalled();
	});
});

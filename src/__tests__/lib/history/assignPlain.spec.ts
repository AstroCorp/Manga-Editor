import { describe, expect, it } from 'vitest';
import { produceWithPatches, enablePatches } from 'immer';
import { assignPlain } from '@/lib/history/assignPlain';

enablePatches();

describe('assignPlain', () => {
	it('emits no patches when the trees are equal', () => {
		const base = {
			title: 'Demo',
			pages: [{ id: 'p1', name: 'Page 1' }],
		};
		const [, patches] = produceWithPatches(base, (draft) => {
			assignPlain(draft, {
				title: 'Demo',
				pages: [{ id: 'p1', name: 'Page 1' }],
			});
		});

		expect(patches).toEqual([]);
	});

	it('emits a field patch instead of replacing the whole tree', () => {
		const base = {
			title: 'Demo',
			pages: [{ id: 'p1', name: 'Page 1' }],
		};
		const [, patches] = produceWithPatches(base, (draft) => {
			assignPlain(draft, {
				title: 'Demo',
				pages: [{ id: 'p1', name: 'Cover' }],
			});
		});

		expect(patches).toEqual([
			{
				op: 'replace',
				path: ['pages', 0, 'name'],
				value: 'Cover',
			},
		]);
	});

	it('deletes missing keys and shortens arrays', () => {
		const base = {
			title: 'Demo',
			extra: true,
			pages: [{ id: 'p1' }, { id: 'p2' }],
		};
		const [next, patches] = produceWithPatches(base, (draft) => {
			assignPlain(draft, {
				title: 'Demo',
				pages: [{ id: 'p1' }],
			});
		});

		expect(next).toEqual({
			title: 'Demo',
			pages: [{ id: 'p1' }],
		});
		expect(patches.some((patch) => patch.op === 'remove')).toBe(true);
	});
});

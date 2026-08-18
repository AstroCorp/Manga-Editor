import { describe, expect, it } from 'vitest';
import { captureDocument } from '@/lib/history/documentSnapshot';
import {
	HISTORY_LABEL,
	MAX_HISTORY_MOVEMENTS,
} from '@/lib/history/historyEnums';
import {
	canRedoHistory,
	canUndoHistory,
	createHistoryState,
	jumpHistoryIndex,
	listHistoryItems,
	pushMovement,
	stepHistoryIndex,
} from '@/lib/history/historyStack';
import { Page } from '@/models/Page';
import type { HistoryDocumentJSON } from '@/types/history';

const snapshotOf = (name: string): HistoryDocumentJSON => {
	const page = Page.createBlank(1);

	page.name = name;

	return captureDocument({
		title: 'Untitled',
		activePageId: page.id,
		pages: [page],
	});
};

describe('historyStack', () => {
	it('starts with a baseline that cannot undo', () => {
		const state = createHistoryState(snapshotOf('Start page'));

		expect(state.entries).toHaveLength(1);
		expect(state.entries[0]?.label).toBe(HISTORY_LABEL.Start);
		expect(canUndoHistory(state)).toBe(false);
		expect(canRedoHistory(state)).toBe(false);
	});

	it('pushes a movement and discards the future after jumping back', () => {
		let state = createHistoryState(snapshotOf('A'));

		state = pushMovement(state, HISTORY_LABEL.AddPanel, snapshotOf('B'));
		state = pushMovement(state, HISTORY_LABEL.AddText, snapshotOf('C'));

		const back = stepHistoryIndex(state, -1);

		expect(back).not.toBeNull();
		state = back!.state;

		expect(canRedoHistory(state)).toBe(true);

		state = pushMovement(state, HISTORY_LABEL.AddLayer, snapshotOf('D'));

		expect(state.entries.map((entry) => entry.label)).toEqual([
			HISTORY_LABEL.Start,
			HISTORY_LABEL.AddPanel,
			HISTORY_LABEL.AddLayer,
		]);
		expect(canRedoHistory(state)).toBe(false);
	});

	it('skips a push when the snapshot did not change', () => {
		const snapshot = snapshotOf('Same');
		let state = createHistoryState(snapshot);

		state = pushMovement(state, HISTORY_LABEL.EditText, snapshot);

		expect(state.entries).toHaveLength(1);
	});

	it('jumps to a past entry and lists newest first', () => {
		let state = createHistoryState(snapshotOf('A'));

		state = pushMovement(state, HISTORY_LABEL.AddPanel, snapshotOf('B'));
		state = pushMovement(state, HISTORY_LABEL.AddText, snapshotOf('C'));

		const target = state.entries[1]!;
		const jumped = jumpHistoryIndex(state, target.id);

		expect(jumped?.state.index).toBe(1);

		const items = listHistoryItems(jumped!.state.entries, jumped!.state.index);

		expect(items.map((item) => item.label)).toEqual([
			HISTORY_LABEL.AddText,
			HISTORY_LABEL.AddPanel,
			HISTORY_LABEL.Start,
		]);
		expect(items[0]?.isFuture).toBe(true);
		expect(items[1]?.isCurrent).toBe(true);
	});

	it(`keeps at most ${MAX_HISTORY_MOVEMENTS} movements`, () => {
		let state = createHistoryState(snapshotOf('base'));

		for (let index = 0; index < MAX_HISTORY_MOVEMENTS + 5; index += 1) {
			state = pushMovement(
				state,
				HISTORY_LABEL.AddPanel,
				snapshotOf(`page-${index}`),
			);
		}

		expect(state.entries).toHaveLength(MAX_HISTORY_MOVEMENTS + 1);
		expect(state.entries[0]?.label).toBe(HISTORY_LABEL.AddPanel);
		expect(state.index).toBe(MAX_HISTORY_MOVEMENTS);
	});

	it('returns null when stepping or jumping out of range', () => {
		const state = createHistoryState(snapshotOf('A'));

		expect(stepHistoryIndex(state, -1)).toBeNull();
		expect(stepHistoryIndex(state, 1)).toBeNull();
		expect(jumpHistoryIndex(state, 'missing')).toBeNull();
		expect(jumpHistoryIndex(state, state.entries[0]!.id)).toBeNull();
	});
});

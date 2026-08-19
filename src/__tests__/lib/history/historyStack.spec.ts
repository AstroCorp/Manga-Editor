import { describe, expect, it } from 'vitest';
import { captureDocument } from '@/lib/history/documentSnapshot';
import {
	HISTORY_LABEL,
	MAX_HISTORY_MOVEMENTS,
} from '@/lib/history/historyEnums';
import { createImageAssetStore } from '@/lib/history/imageAssets';
import {
	canRedoHistory,
	canUndoHistory,
	createHistoryState,
	jumpHistoryIndex,
	listHistoryItems,
	pushMovement,
	stepHistoryIndex,
	dropOldestMovement,
	fromPersistedHistory,
	toPersistedHistory,
} from '@/lib/history/historyStack';
import { Page } from '@/models/Page';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import type { HistoryDocumentJSON } from '@/types/history';

const assets = createImageAssetStore();

const snapshotOf = (name: string): HistoryDocumentJSON => {
	const page = Page.createBlank(1);

	page.name = name;

	return captureDocument({
		title: 'Untitled',
		activePageId: page.id,
		pages: [page],
		intern: assets.intern,
	});
};

describe('historyStack', () => {
	it('starts with a baseline that cannot undo', () => {
		const state = createHistoryState(snapshotOf('Start page'));

		expect(state.entries).toHaveLength(1);
		expect(state.entries[0]?.label).toBe(HISTORY_LABEL.Start);
		expect(state.entries[0]?.patches).toEqual([]);
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
		expect(state.entries[0]?.patches).toEqual([]);
		expect(state.index).toBe(MAX_HISTORY_MOVEMENTS);
	});

	it('returns null when stepping or jumping out of range', () => {
		const state = createHistoryState(snapshotOf('A'));

		expect(stepHistoryIndex(state, -1)).toBeNull();
		expect(stepHistoryIndex(state, 1)).toBeNull();
		expect(jumpHistoryIndex(state, 'missing')).toBeNull();
		expect(jumpHistoryIndex(state, state.entries[0]!.id)).toBeNull();
	});

	it('stores image refs in patches instead of data URLs', () => {
		const intern = createImageAssetStore();
		const page = Page.createBlank(1);
		const start = captureDocument({
			title: 'Untitled',
			activePageId: page.id,
			pages: [page],
			intern: intern.intern,
		});
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 8, y: 0 },
				{ x: 8, y: 8 },
			],
			2,
		);

		shape.setImage(
			new ShapeImage({
				src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
				left: 1,
				top: 2,
				scaleX: 1,
				scaleY: 1,
			}),
		);
		page.addShape(shape);

		const next = captureDocument({
			title: 'Untitled',
			activePageId: page.id,
			pages: [page],
			intern: intern.intern,
		});
		const state = pushMovement(
			createHistoryState(start),
			HISTORY_LABEL.PlaceImage,
			next,
		);
		const serialized = JSON.stringify(state.entries);

		expect(serialized).not.toContain('data:image');
		expect(serialized).toContain('assetId');
		expect(Object.keys(intern.exportAll())).toHaveLength(1);
	});

	it('bakes the oldest movement into the baseline when dropping it', () => {
		let state = createHistoryState(snapshotOf('A'));

		state = pushMovement(state, HISTORY_LABEL.AddPanel, snapshotOf('B'));
		state = pushMovement(state, HISTORY_LABEL.AddText, snapshotOf('C'));

		const dropped = dropOldestMovement(state);

		expect(dropped).not.toBeNull();
		expect(dropped!.entries[0]?.label).toBe(HISTORY_LABEL.AddPanel);
		expect(dropped!.entries[0]?.patches).toEqual([]);
		expect(dropped!.current).toEqual(state.current);

		const restored = fromPersistedHistory(toPersistedHistory(dropped!));

		expect(restored.current).toEqual(dropped!.current);
		expect(dropOldestMovement(createHistoryState(snapshotOf('A')))).toBeNull();
	});

	it('steps back and forward with inverse patches', () => {
		let state = createHistoryState(snapshotOf('A'));

		state = pushMovement(state, HISTORY_LABEL.AddPanel, snapshotOf('B'));

		const back = stepHistoryIndex(state, -1);

		expect(back?.state.index).toBe(0);
		expect(back?.snapshot).toEqual(state.baseline);

		const forward = stepHistoryIndex(back!.state, 1);

		expect(forward?.state.index).toBe(1);
		expect(forward?.snapshot).toEqual(state.current);
	});
});

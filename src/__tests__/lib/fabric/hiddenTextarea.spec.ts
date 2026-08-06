import { afterEach, describe, expect, it, vi } from 'vitest';
import { IText, Textbox } from 'fabric';
import {
	captureScrollSnapshot,
	ensureFabricHiddenTextareaContainer,
	restoreScrollAfterTextEditing,
	setupFabricHiddenTextarea,
} from '@/lib/fabric/hiddenTextarea';

describe('hiddenTextarea', () => {
	afterEach(() => {
		document
			.querySelectorAll('[data-fabric="textarea-container"]')
			.forEach((node) => {
				node.remove();
			});

		IText.ownDefaults.hiddenTextareaContainer = null;
		Textbox.ownDefaults.hiddenTextareaContainer = null;
		vi.restoreAllMocks();
	});

	it('creates a clipped fixed container once', () => {
		const first = ensureFabricHiddenTextareaContainer();
		const second = ensureFabricHiddenTextareaContainer();

		expect(first).toBe(second);
		expect(first.getAttribute('data-fabric')).toBe('textarea-container');
		expect(first.style.position).toBe('fixed');
		expect(first.style.overflow).toBe('hidden');
		expect(document.body.contains(first)).toBe(true);
	});

	it('wires the container into IText and Textbox defaults', () => {
		setupFabricHiddenTextarea();

		const container = document.querySelector(
			'[data-fabric="textarea-container"]',
		);

		expect(container).toBeTruthy();
		expect(IText.ownDefaults.hiddenTextareaContainer).toBe(container);
		expect(Textbox.ownDefaults.hiddenTextareaContainer).toBe(container);
	});

	it('restores stage and window scroll after editing focus', () => {
		const root = document.createElement('div');
		root.scrollLeft = 12;
		root.scrollTop = 34;

		const snapshot = captureScrollSnapshot(root);

		root.scrollLeft = 999;
		root.scrollTop = 999;

		const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

		restoreScrollAfterTextEditing(root, snapshot);

		expect(root.scrollLeft).toBe(12);
		expect(root.scrollTop).toBe(34);
		expect(scrollTo).toHaveBeenCalledWith(snapshot.x, snapshot.y);
	});
});

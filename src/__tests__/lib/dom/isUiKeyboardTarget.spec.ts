import { describe, expect, it } from 'vitest';
import { isUiKeyboardTarget } from '@/lib/dom/isUiKeyboardTarget';

describe('isUiKeyboardTarget', () => {
	it('detects native form controls', () => {
		expect(isUiKeyboardTarget(document.createElement('input'))).toBe(true);
		expect(isUiKeyboardTarget(document.createElement('textarea'))).toBe(
			true,
		);
		expect(isUiKeyboardTarget(document.createElement('select'))).toBe(true);
	});

	it('detects contenteditable and popup roles', () => {
		const editable = document.createElement('div');

		editable.setAttribute('contenteditable', 'true');
		document.body.appendChild(editable);
		expect(isUiKeyboardTarget(editable)).toBe(true);
		editable.remove();

		const listbox = document.createElement('div');

		listbox.setAttribute('role', 'listbox');
		document.body.appendChild(listbox);

		const option = document.createElement('div');

		listbox.appendChild(option);
		expect(isUiKeyboardTarget(option)).toBe(true);

		listbox.remove();
	});

	it('ignores plain elements and non-elements', () => {
		expect(isUiKeyboardTarget(document.createElement('div'))).toBe(false);
		expect(isUiKeyboardTarget(null)).toBe(false);
		expect(isUiKeyboardTarget(window)).toBe(false);
	});
});

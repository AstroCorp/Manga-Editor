/** True si el foco está en un control de UI que debe recibir el teclado. */
export const isUiKeyboardTarget = (target: EventTarget | null): boolean => {
	if (!(target instanceof HTMLElement)) {
		return false;
	}

	if (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement ||
		target instanceof HTMLSelectElement
	) {
		return true;
	}

	const contentEditable = target.getAttribute('contenteditable');

	if (
		target.isContentEditable ||
		contentEditable === '' ||
		contentEditable === 'true'
	) {
		return true;
	}

	return Boolean(
		target.closest('[role="listbox"], [role="dialog"], [role="menu"]'),
	);
};

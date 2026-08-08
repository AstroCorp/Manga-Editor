import type { Canvas, FabricObject } from 'fabric';
import { getPageTextbox } from '@/lib/fabric/textFabric';
import { isPageText, resolvePageTextObject } from '@/lib/fabric/isGuide';
import type { PageTextObject } from '@/types/fabric';
import type {
	EditingPageText,
	EditingTextareaKeyEvent,
	EditingTextareaKeyResult,
} from '@/types/text';

export const resolveEditingTextbox = (
	target: FabricObject | null | undefined,
): EditingPageText | null => {
	if (!target || !isPageText(target)) {
		return null;
	}

	const pageText = resolvePageTextObject(target) as PageTextObject;
	const textbox = getPageTextbox(pageText);

	if (!textbox) {
		return null;
	}

	return { pageText, textbox };
};

export const findEditingPageText = (
	canvas: Canvas | null | undefined,
): EditingPageText | null => {
	if (!canvas) {
		return null;
	}

	for (const object of canvas.getObjects()) {
		const editing = resolveEditingTextbox(object);

		if (editing?.textbox.isEditing) {
			return editing;
		}
	}

	return null;
};

/**
 * En texto boxed el active es el Group. Al deseleccionarlo Fabric no llama
 * onDeselect del Textbox hijo, así que hay que cerrar la edición a mano.
 */
export const exitOrphanPageTextEditing = (
	canvas: Canvas,
	active: FabricObject | null | undefined,
): void => {
	for (const object of canvas.getObjects()) {
		const editing = resolveEditingTextbox(object);

		if (!editing?.textbox.isEditing) {
			continue;
		}

		const { pageText, textbox } = editing;

		if (active !== textbox && active !== pageText) {
			textbox.exitEditing();
		}
	}
};

export const isHostedTextEditing = (
	active: FabricObject | null | undefined,
	editing: EditingPageText,
): boolean => {
	return active !== editing.textbox;
};

/**
 * Aplica una tecla sobre el textarea oculto de Fabric cuando el foco está
 * en el canvas (caso típico del texto boxed).
 */
export const applyEditingTextareaKey = (
	textarea: HTMLTextAreaElement,
	event: EditingTextareaKeyEvent,
): EditingTextareaKeyResult => {
	const start = textarea.selectionStart ?? 0;
	const end = textarea.selectionEnd ?? 0;
	const value = textarea.value;
	const mod = event.ctrlKey || event.metaKey;

	if (mod && event.key.toLowerCase() === 'a') {
		return 'selectAll';
	}

	if (event.key === 'Backspace' || event.key === 'Delete') {
		if (start !== end) {
			textarea.value = value.slice(0, start) + value.slice(end);
			textarea.setSelectionRange(start, start);
		} else if (event.key === 'Backspace' && start > 0) {
			textarea.value = value.slice(0, start - 1) + value.slice(start);
			textarea.setSelectionRange(start - 1, start - 1);
		} else if (event.key === 'Delete' && start < value.length) {
			textarea.value = value.slice(0, start) + value.slice(start + 1);
			textarea.setSelectionRange(start, start);
		} else {
			return 'ignored';
		}

		return 'changed';
	}

	if (event.key.length === 1 && !mod && !event.altKey) {
		const caret = start + event.key.length;

		textarea.value = value.slice(0, start) + event.key + value.slice(end);
		textarea.setSelectionRange(caret, caret);

		return 'changed';
	}

	return 'ignored';
};

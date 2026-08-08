import type { FabricObject, Textbox, TPointerEvent } from 'fabric';
import type { PageTextObject } from '@/types/fabric';

/** Host de página (Textbox o Group) + Textbox editable en curso. */
export type EditingPageText = {
	pageText: PageTextObject;
	textbox: Textbox;
};

export type EditingTextareaKeyResult = 'changed' | 'selectAll' | 'ignored';

export type EditingTextareaKeyEvent = Pick<
	KeyboardEvent,
	'key' | 'ctrlKey' | 'metaKey' | 'altKey'
>;

/** Doble clic → palabra; triple clic → todo. */
export type EditingTextSelectMode = 'word' | 'all';

export type FabricTextPointerEvent = {
	e?: TPointerEvent;
	target?: FabricObject;
};

export type FabricTextTargetEvent = {
	target?: FabricObject;
};

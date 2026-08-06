import { IText, Textbox } from 'fabric';

const CONTAINER_ATTR = 'data-fabric';
const CONTAINER_VALUE = 'textarea-container';

/**
 * Contenedor off-screen para el textarea oculto de Fabric.
 * Evita append a document.body (offset mal calculado con stage overflow-auto)
 * y el crecimiento del scroll del documento al editar texto abajo.
 */
export const ensureFabricHiddenTextareaContainer = (
	doc: Document = document,
): HTMLElement => {
	const existing = doc.querySelector<HTMLElement>(
		`[${CONTAINER_ATTR}="${CONTAINER_VALUE}"]`,
	);

	if (existing) {
		return existing;
	}

	const container = doc.createElement('div');
	container.setAttribute(CONTAINER_ATTR, CONTAINER_VALUE);
	container.style.cssText =
		'position:fixed;inset:0 auto auto 0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;';
	doc.body.appendChild(container);

	return container;
};

export const setupFabricHiddenTextarea = () => {
	if (typeof document === 'undefined') {
		return;
	}

	const container = ensureFabricHiddenTextareaContainer();

	IText.ownDefaults.hiddenTextareaContainer = container;
	Textbox.ownDefaults.hiddenTextareaContainer = container;
};

/** Restaura el scroll del stage/ventana tras el focus del textarea de Fabric. */
export const restoreScrollAfterTextEditing = (
	rootEl: HTMLElement | null | undefined,
	snapshot: { scrollLeft: number; scrollTop: number; x: number; y: number },
) => {
	const restore = () => {
		if (rootEl) {
			rootEl.scrollLeft = snapshot.scrollLeft;
			rootEl.scrollTop = snapshot.scrollTop;
		}

		window.scrollTo(snapshot.x, snapshot.y);
	};

	restore();
	requestAnimationFrame(restore);
};

export const captureScrollSnapshot = (rootEl: HTMLElement | null | undefined) => {
	return {
		scrollLeft: rootEl?.scrollLeft ?? 0,
		scrollTop: rootEl?.scrollTop ?? 0,
		x: typeof window !== 'undefined' ? window.scrollX : 0,
		y: typeof window !== 'undefined' ? window.scrollY : 0,
	};
};

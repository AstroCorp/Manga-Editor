import { watch } from 'vue';
import { useEventListener } from '@vueuse/core';
import { FabricImage, Textbox, type Canvas, type FabricObject } from 'fabric';
import {
	getPanelId,
	getTextId,
	isGuide,
	isPageText,
	isPanel,
	isPanelImage,
	removeObjectsByPanelId,
} from '@/lib/fabric/isGuide';
import {
	captureScrollSnapshot,
	restoreScrollAfterTextEditing,
} from '@/lib/fabric/hiddenTextarea';
import {
	nudgeDeltaForArrowKey,
	nudgeFabricObject,
} from '@/lib/fabric/nudgeObject';
import { shapeImageFromFabric } from '@/lib/fabric/panelImageFabric';
import { textBlockFromFabric } from '@/lib/fabric/textFabric';
import { clampStrokeWidth } from '@/lib/page/pageLimits';
import { useMangaStore } from '@/stores/manga';
import type { PageTextObject } from '@/types/fabric';
import type { SelectionDeps } from '@/types/panel';

const isUiKeyboardTarget = (target: EventTarget | null): boolean => {
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

	if (target.isContentEditable) {
		return true;
	}

	return Boolean(
		target.closest('[role="listbox"], [role="dialog"], [role="menu"]'),
	);
};

export const usePanelSelection = ({
	fabricCanvas,
	rootEl,
	syncInteractionMode,
	cancelStroke,
}: SelectionDeps) => {
	const mangaStore = useMangaStore();

	const isEditingText = (object: FabricObject | null | undefined): boolean => {
		if (!object || !isPageText(object)) {
			return false;
		}

		return Boolean((object as Textbox).isEditing);
	};

	/** Borra panel (+ imagen), solo la imagen activa, o un texto. */
	const removeActive = (): boolean => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return false;
		}

		const active = canvas.getActiveObject() as FabricObject | null;

		if (!active || isGuide(active) || isEditingText(active)) {
			return false;
		}

		const panelId = getPanelId(active);

		if (isPanel(active) && panelId) {
			mangaStore.removeShape(panelId);
			removeObjectsByPanelId(canvas, panelId);

			canvas.discardActiveObject();

			syncInteractionMode();

			canvas.requestRenderAll();

			return true;
		}

		if (isPanelImage(active) && panelId) {
			mangaStore.setShapeImage(panelId, null);

			canvas.remove(active);
			canvas.discardActiveObject();

			syncInteractionMode();

			canvas.requestRenderAll();

			return true;
		}

		const textId = getTextId(active);

		if (isPageText(active) && textId) {
			mangaStore.removeText(textId);
			canvas.remove(active);
			canvas.discardActiveObject();

			syncInteractionMode();

			canvas.requestRenderAll();

			return true;
		}

		return false;
	};

	/** Aplica el stroke de página a todos los paneles del canvas. */
	const applyPageStrokeWidth = (width: number) => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		const nextWidth = clampStrokeWidth(width);

		canvas.getObjects().forEach((object) => {
			if (!isPanel(object)) {
				return;
			}

			object.set('strokeWidth', nextWidth);
		});

		canvas.requestRenderAll();
	};

	const persistTextObject = (object: FabricObject) => {
		if (!isPageText(object)) {
			return;
		}

		const textId = getTextId(object);

		if (!textId) {
			return;
		}

		mangaStore.updateText(
			textId,
			textBlockFromFabric(object as PageTextObject),
		);
	};

	/** Tras mover/escalar imagen o texto en Fabric, persiste transform en el dominio. */
	const onObjectModified = (event: { target?: FabricObject }) => {
		const active = event.target ?? fabricCanvas.value?.getActiveObject();

		if (!active) {
			return;
		}

		if (isPageText(active)) {
			persistTextObject(active);

			return;
		}

		if (!(active instanceof FabricImage) || !isPanelImage(active)) {
			return;
		}

		const panelId = getPanelId(active);

		if (!panelId) {
			return;
		}

		mangaStore.setShapeImage(panelId, shapeImageFromFabric(active));
	};

	const onTextChanged = (event: { target?: FabricObject }) => {
		if (event.target) {
			persistTextObject(event.target);
		}
	};

	/** Snapshot previo al focus del textarea (mouse:down ocurre antes de enterEditing). */
	let scrollBeforeEdit = captureScrollSnapshot(rootEl.value);

	const onMouseDown = () => {
		scrollBeforeEdit = captureScrollSnapshot(rootEl.value);
	};

	const onEditingEntered = (event: { target?: FabricObject }) => {
		cancelStroke();

		const target = event.target;

		if (!target || !isPageText(target)) {
			return;
		}

		target.set({
			lockMovementX: true,
			lockMovementY: true,
			lockRotation: true,
			lockScalingX: true,
			hasControls: false,
		});
		fabricCanvas.value?.requestRenderAll();
		restoreScrollAfterTextEditing(rootEl.value, scrollBeforeEdit);
	};

	const onEditingExited = (event: { target?: FabricObject }) => {
		if (event.target) {
			persistTextObject(event.target);
		}

		syncInteractionMode();
	};

	const canNudgeObject = (object: FabricObject | null | undefined): boolean => {
		if (!object || isGuide(object) || isEditingText(object)) {
			return false;
		}

		return isPageText(object) || isPanelImage(object);
	};

	const nudgeActiveObject = (event: KeyboardEvent): boolean => {
		const canvas = fabricCanvas.value;
		const delta = nudgeDeltaForArrowKey(event.key, event.repeat);
		const active = canvas?.getActiveObject() as FabricObject | null | undefined;

		if (!canvas || !delta || !active || !canNudgeObject(active)) {
			return false;
		}

		nudgeFabricObject(active, delta);
		canvas.fire('object:modified', { target: active });
		canvas.requestRenderAll();

		return true;
	};

	const onKeyDown = (event: KeyboardEvent) => {
		if (isUiKeyboardTarget(event.target)) {
			return;
		}

		const canvas = fabricCanvas.value;

		if (isEditingText(canvas?.getActiveObject() ?? null)) {
			return;
		}

		if (event.key === 'Escape') {
			cancelStroke();

			return;
		}

		if (nudgeActiveObject(event)) {
			event.preventDefault();

			return;
		}

		if (event.key === 'Delete' || event.key === 'Backspace') {
			if (removeActive()) {
				event.preventDefault();
			}
		}
	};

	const bindSelectionEvents = (canvas: Canvas) => {
		canvas.on('mouse:down', onMouseDown);
		canvas.on('object:modified', onObjectModified);
		canvas.on('text:changed', onTextChanged);
		canvas.on('text:editing:entered', onEditingEntered);
		canvas.on('text:editing:exited', onEditingExited);
	};

	const unbindSelectionEvents = (canvas: Canvas) => {
		canvas.off('mouse:down', onMouseDown);
		canvas.off('object:modified', onObjectModified);
		canvas.off('text:changed', onTextChanged);
		canvas.off('text:editing:entered', onEditingEntered);
		canvas.off('text:editing:exited', onEditingExited);
	};

	watch(
		fabricCanvas,
		(canvas, _previous, onCleanup) => {
			if (!canvas) {
				return;
			}

			bindSelectionEvents(canvas);

			onCleanup(() => {
				unbindSelectionEvents(canvas);
			});
		},
		{ immediate: true },
	);

	watch(
		() => mangaStore.strokeWidth,
		(width) => {
			applyPageStrokeWidth(width);
		},
	);

	useEventListener(window, 'keydown', onKeyDown);
};

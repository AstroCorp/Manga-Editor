import { watch } from 'vue';
import { useEventListener } from '@vueuse/core';
import {
	FabricImage,
	type Canvas,
	type FabricObject,
} from 'fabric';
import {
	findPanelById,
	findTextById,
	getLayerId,
	getPanelId,
	getTextId,
	isGuide,
	isPageText,
	isPanel,
	isPanelImage,
	removeObjectsByPanelId,
	resolvePageTextObject,
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
import {
	getPageTextbox,
	syncBoxedTextGeometry,
	textBlockFromFabric,
	textBlockToFabric,
} from '@/lib/fabric/textFabric';
import { clampStrokeWidth } from '@/lib/page/pageLimits';
import {
	cloneTextBlockAt,
	copyTextToClipboard,
	peekCopiedText,
} from '@/lib/text/textClipboard';
import {
	DEFAULT_TEXT_FILL,
	DEFAULT_TEXT_FONT_SIZE,
} from '@/models/TextBlock';
import { useMangaStore } from '@/stores/manga';
import { useSelectionStore } from '@/stores/selection';
import type { PageTextObject } from '@/types/fabric';
import type { LayerElementFocusPayload } from '@/types/editor';
import type { PagePoint, TextBlockJSON } from '@/types/page';
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

const isModKey = (event: KeyboardEvent): boolean => {
	return event.ctrlKey || event.metaKey;
};

const clampPasteOrigin = (
	point: PagePoint,
	width: number,
	height: number,
	pageWidth: number,
	pageHeight: number,
): PagePoint => {
	return {
		x: Math.min(Math.max(0, point.x), Math.max(0, pageWidth - width)),
		y: Math.min(Math.max(0, point.y), Math.max(0, pageHeight - height)),
	};
};

const snapshotFromFabricText = (
	textbox: PageTextObject,
	textId: string | null,
): TextBlockJSON => {
	const patch = textBlockFromFabric(textbox);

	return {
		id: textId ?? 'clipboard',
		content: patch.content ?? '',
		left: patch.left ?? 0,
		top: patch.top ?? 0,
		width: patch.width ?? 0,
		fontSize: patch.fontSize ?? DEFAULT_TEXT_FONT_SIZE,
		fill: patch.fill ?? DEFAULT_TEXT_FILL,
		fontWeight: patch.fontWeight,
		fontStyle: patch.fontStyle,
		underline: patch.underline,
		linethrough: patch.linethrough,
		stroke: patch.stroke,
		strokeWidth: patch.strokeWidth,
		lineHeight: patch.lineHeight,
		textAlign: patch.textAlign,
		angle: patch.angle,
		styles: patch.styles,
		box: patch.box ?? null,
	};
};

export const usePanelSelection = ({
	fabricCanvas,
	rootEl,
	syncInteractionMode,
	cancelStroke,
	discardSelection,
	registerCanvasAction,
	onAfterPageApply,
}: SelectionDeps) => {
	const mangaStore = useMangaStore();
	const selectionStore = useSelectionStore();
	let lastPointer: PagePoint | null = null;

	const syncFocusedFromCanvas = () => {
		const canvas = fabricCanvas.value;
		const active = canvas?.getActiveObject() as FabricObject | null | undefined;

		if (!canvas || !active || isGuide(active)) {
			selectionStore.clearFocused();

			return;
		}

		const layerId = getLayerId(active) ?? mangaStore.activeLayer.id;
		const panelId = getPanelId(active);

		if ((isPanel(active) || isPanelImage(active)) && panelId) {
			selectionStore.setFocused({
				kind: 'shape',
				id: panelId,
				layerId,
			});

			return;
		}

		const textId = getTextId(active);

		if (isPageText(active) && textId) {
			selectionStore.setFocused({
				kind: 'text',
				id: textId,
				layerId,
			});

			return;
		}

		selectionStore.clearFocused();
	};

	const selectShapeOnCanvas = (shapeId: string): boolean => {
		const canvas = fabricCanvas.value;
		const panel = canvas ? findPanelById(canvas, shapeId) : null;

		if (!canvas || !panel || !panel.selectable) {
			return false;
		}

		canvas.setActiveObject(panel);
		syncInteractionMode();
		canvas.requestRenderAll();
		syncFocusedFromCanvas();

		return true;
	};

	const selectTextOnCanvas = (textId: string): boolean => {
		const canvas = fabricCanvas.value;
		const textObject = canvas ? findTextById(canvas, textId) : null;

		if (!canvas || !textObject || !textObject.selectable) {
			return false;
		}

		canvas.setActiveObject(textObject);
		syncInteractionMode();
		canvas.requestRenderAll();
		syncFocusedFromCanvas();

		return true;
	};

	const applyPendingFocus = () => {
		const pending = selectionStore.takePendingFocus();

		if (!pending) {
			return;
		}

		if (pending.kind === 'shape') {
			selectShapeOnCanvas(pending.id);

			return;
		}

		selectTextOnCanvas(pending.id);
	};

	const focusLayerElement = (payload: LayerElementFocusPayload) => {
		cancelStroke();
		selectionStore.setFocused({
			kind: payload.kind,
			id: payload.id,
			layerId: payload.layerId,
		});

		if (payload.layerId !== mangaStore.activeLayer.id) {
			selectionStore.queuePendingFocus({
				kind: payload.kind,
				id: payload.id,
			});
			mangaStore.selectLayer(payload.layerId);

			return;
		}

		if (payload.kind === 'shape') {
			selectShapeOnCanvas(payload.id);

			return;
		}

		selectTextOnCanvas(payload.id);
	};

	const deleteLayerElement = (payload: LayerElementFocusPayload) => {
		const canvas = fabricCanvas.value;

		cancelStroke();

		if (payload.kind === 'shape') {
			mangaStore.removeShape(payload.id);

			if (canvas) {
				removeObjectsByPanelId(canvas, payload.id);
				canvas.discardActiveObject();
				syncInteractionMode();
				canvas.requestRenderAll();
			}
		} else {
			mangaStore.removeText(payload.id);

			if (canvas) {
				const textObject = findTextById(canvas, payload.id);

				if (textObject) {
					canvas.remove(textObject);
				}

				canvas.discardActiveObject();
				syncInteractionMode();
				canvas.requestRenderAll();
			}
		}

		if (
			selectionStore.focused?.id === payload.id &&
			selectionStore.focused.kind === payload.kind
		) {
			selectionStore.clearFocused();
		}
	};

	const isEditingText = (object: FabricObject | null | undefined): boolean => {
		if (!object || !isPageText(object)) {
			return false;
		}

		const textbox = getPageTextbox(object as PageTextObject);

		return Boolean(textbox?.isEditing);
	};

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
			selectionStore.clearFocused();

			syncInteractionMode();

			canvas.requestRenderAll();

			return true;
		}

		if (isPanelImage(active) && panelId) {
			mangaStore.setShapeImage(panelId, null);

			canvas.remove(active);
			canvas.discardActiveObject();
			selectionStore.clearFocused();

			syncInteractionMode();

			canvas.requestRenderAll();

			return true;
		}

		const textId = getTextId(active);

		if (isPageText(active) && textId) {
			mangaStore.removeText(textId);
			canvas.remove(active);
			canvas.discardActiveObject();
			selectionStore.clearFocused();

			syncInteractionMode();

			canvas.requestRenderAll();

			return true;
		}

		return false;
	};

	const applyPageStrokeWidth = (width: number) => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		const nextWidth = clampStrokeWidth(width);
		const activeLayerId = mangaStore.activeLayer.id;

		canvas.getObjects().forEach((object) => {
			if (!isPanel(object) || getLayerId(object) !== activeLayerId) {
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

		const pageText = resolvePageTextObject(object) as PageTextObject;
		syncBoxedTextGeometry(pageText);
		mangaStore.updateText(textId, textBlockFromFabric(pageText));
	};

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

	let scrollBeforeEdit = captureScrollSnapshot(rootEl.value);

	const onMouseDown = () => {
		scrollBeforeEdit = captureScrollSnapshot(rootEl.value);
	};

	const onMouseMove = (event: { e?: Event }) => {
		const canvas = fabricCanvas.value;

		if (!canvas || !event.e) {
			return;
		}

		const point = canvas.getScenePoint(event.e as MouseEvent);

		lastPointer = { x: point.x, y: point.y };
	};

	const onEditingEntered = (event: { target?: FabricObject }) => {
		cancelStroke();

		const target = event.target;

		if (!target || !isPageText(target)) {
			return;
		}

		const pageText = resolvePageTextObject(target);

		pageText.set({
			lockMovementX: true,
			lockMovementY: true,
			lockRotation: true,
			lockScalingX: true,
			hasControls: false,
		});
		fabricCanvas.value?.requestRenderAll();
		restoreScrollAfterTextEditing(rootEl.value, scrollBeforeEdit);
	};

	/** El Group boxed no es interactivo: doble clic entra en edición del Textbox interno. */
	const onDblClick = (event: { target?: FabricObject }) => {
		const canvas = fabricCanvas.value;
		const target = event.target;

		if (!canvas || !target || !isPageText(target)) {
			return;
		}

		const pageText = resolvePageTextObject(target) as PageTextObject;
		const textbox = getPageTextbox(pageText);

		if (!textbox || textbox.isEditing) {
			return;
		}

		if (canvas.getActiveObject() !== pageText) {
			canvas.setActiveObject(pageText);
		}

		textbox.enterEditing();
		textbox.selectAll();
		canvas.requestRenderAll();
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

	const copyActiveText = (): boolean => {
		const canvas = fabricCanvas.value;
		const active = canvas?.getActiveObject() as FabricObject | null | undefined;

		if (!canvas || !active || !isPageText(active) || isEditingText(active)) {
			return false;
		}

		const textId = getTextId(active);
		const fromStore = textId
			? mangaStore.texts.find((text) => {
					return text.id === textId;
				})
			: undefined;

		copyTextToClipboard(
			fromStore
				? fromStore.toJSON()
				: snapshotFromFabricText(active as PageTextObject, textId ?? null),
		);

		return true;
	};

	const pasteCopiedText = (): boolean => {
		const canvas = fabricCanvas.value;
		const payload = peekCopiedText();

		if (!canvas || !payload) {
			return false;
		}

		const page = mangaStore.activePage;
		const pointer = lastPointer ?? {
			x: payload.left,
			y: payload.top,
		};
		const origin = clampPasteOrigin(
			pointer,
			payload.width,
			payload.fontSize,
			page.width,
			page.height,
		);
		const text = cloneTextBlockAt(payload, origin.x, origin.y);

		mangaStore.addText(text);

		const fabricText = textBlockToFabric(text, {
			layerId: mangaStore.activeLayer.id,
			interactive: true,
		});

		canvas.add(fabricText);
		canvas.setActiveObject(fabricText);
		syncInteractionMode();
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
			discardSelection();
			fabricCanvas.value?.requestRenderAll();
			event.preventDefault();

			return;
		}

		if (isModKey(event) && event.key.toLowerCase() === 'c') {
			if (copyActiveText()) {
				event.preventDefault();
			}

			return;
		}

		if (isModKey(event) && event.key.toLowerCase() === 'v') {
			if (pasteCopiedText()) {
				event.preventDefault();
			}

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
		canvas.on('mouse:move', onMouseMove);
		canvas.on('mouse:dblclick', onDblClick);
		canvas.on('object:modified', onObjectModified);
		canvas.on('text:changed', onTextChanged);
		canvas.on('text:editing:entered', onEditingEntered);
		canvas.on('text:editing:exited', onEditingExited);
		canvas.on('selection:created', syncFocusedFromCanvas);
		canvas.on('selection:updated', syncFocusedFromCanvas);
		canvas.on('selection:cleared', syncFocusedFromCanvas);
	};

	const unbindSelectionEvents = (canvas: Canvas) => {
		canvas.off('mouse:down', onMouseDown);
		canvas.off('mouse:move', onMouseMove);
		canvas.off('mouse:dblclick', onDblClick);
		canvas.off('object:modified', onObjectModified);
		canvas.off('text:changed', onTextChanged);
		canvas.off('text:editing:entered', onEditingEntered);
		canvas.off('text:editing:exited', onEditingExited);
		canvas.off('selection:created', syncFocusedFromCanvas);
		canvas.off('selection:updated', syncFocusedFromCanvas);
		canvas.off('selection:cleared', syncFocusedFromCanvas);
	};

	registerCanvasAction({
		focusLayerElement,
		deleteLayerElement,
	});

	onAfterPageApply(applyPendingFocus);

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

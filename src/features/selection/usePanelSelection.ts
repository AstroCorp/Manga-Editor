import { watch } from 'vue';
import { useEventListener } from '@vueuse/core';
import {
	FabricImage,
	Textbox,
	type Canvas,
	type FabricObject,
} from 'fabric';
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
import { textBlockFromFabric, textBlockToFabric } from '@/lib/fabric/textFabric';
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
import type { PageTextObject } from '@/types/fabric';
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
	};
};

export const usePanelSelection = ({
	fabricCanvas,
	rootEl,
	syncInteractionMode,
	cancelStroke,
}: SelectionDeps) => {
	const mangaStore = useMangaStore();
	let lastPointer: PagePoint | null = null;

	const isEditingText = (object: FabricObject | null | undefined): boolean => {
		if (!object || !isPageText(object)) {
			return false;
		}

		return Boolean((object as Textbox).isEditing);
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
		canvas.on('object:modified', onObjectModified);
		canvas.on('text:changed', onTextChanged);
		canvas.on('text:editing:entered', onEditingEntered);
		canvas.on('text:editing:exited', onEditingExited);
	};

	const unbindSelectionEvents = (canvas: Canvas) => {
		canvas.off('mouse:down', onMouseDown);
		canvas.off('mouse:move', onMouseMove);
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

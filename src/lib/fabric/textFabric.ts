import { Control, Group, Rect, Textbox, controlsUtils } from 'fabric';
import type { TPointerEvent, Transform } from 'fabric';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import {
	isBoldWeight,
	measureTextContentWidth,
	normalizeFontStyle,
	normalizeLineHeight,
	normalizeStrokeWidth,
	normalizeTextAlign,
	stylesFromFabric,
	stylesToFabric,
	toHexColor,
	toStrokeColor,
} from '@/lib/fabric/textStyles';
import { normalizeFontFamilyName } from '@/lib/fonts/googleFontsCatalog';
import {
	DEFAULT_TEXT_ALIGN,
	DEFAULT_TEXT_BOX,
	DEFAULT_TEXT_FONT_FAMILY,
	DEFAULT_TEXT_FONT_SIZE,
	DEFAULT_TEXT_LINE_HEIGHT,
	DEFAULT_TEXT_STROKE_WIDTH,
	type TextBlock,
} from '@/models/TextBlock';
import type { PageTextObject } from '@/types/fabric';
import type {
	TextBlockPatch,
	TextBoxStyle,
	TextBoxVerticalAlign,
} from '@/types/page';

type TextToFabricOptions = {
	layerId: string;
	interactive: boolean;
};

const normalizeVerticalAlign = (
	value: unknown,
): TextBoxVerticalAlign => {
	if (value === 'top' || value === 'bottom') {
		return value;
	}

	return 'middle';
};

/** Top del textbox dentro de la caja (coords locales pre-layout). */
export const boxedTextTop = (
	outerHeight: number,
	textHeight: number,
	padding: number,
	verticalAlign: TextBoxVerticalAlign,
): number => {
	if (verticalAlign === 'bottom') {
		return Math.max(padding, outerHeight - padding - textHeight);
	}

	if (verticalAlign === 'middle') {
		return (outerHeight - textHeight) / 2;
	}

	return padding;
};

/**
 * Fabric incluye strokeWidth en el bbox del Rect: left/top apuntan a la
 * esquina exterior del stroke. Desplazar -stroke/2 alinea el relleno con el
 * Textbox (stroke 0).
 */
export const boxedRectOrigin = (
	outerSize: number,
	strokeWidth: number,
): number => {
	return -outerSize / 2 - Math.max(0, strokeWidth) / 2;
};

export const resolveBoxedOuterHeight = (
	boxHeight: number,
	textHeight: number,
	padding: number,
): number => {
	const minOuter = Math.max(1, Math.round(textHeight + padding * 2));

	return Math.max(minOuter, Math.max(0, Math.round(boxHeight)));
};

/** El ancho de caja no puede ser menor que el del texto (+ padding). */
export const resolveBoxedOuterWidth = (
	boxWidth: number,
	textWidth: number,
	padding: number,
): number => {
	const minOuter = Math.max(1, Math.round(textWidth + padding * 2));

	return Math.max(minOuter, Math.max(0, Math.round(boxWidth)));
};

const createInnerTextbox = (
	text: TextBlock,
	options: { left: number; top: number; interactive: boolean },
): Textbox => {
	const fabricStyles = stylesToFabric(text.styles);
	const stroke = text.stroke;

	return new Textbox(text.content, {
		left: options.left,
		top: options.top,
		width: text.width,
		fontSize: text.fontSize,
		fill: text.fill,
		fontWeight: text.fontWeight,
		fontStyle: text.fontStyle,
		underline: text.underline,
		linethrough: text.linethrough,
		stroke: stroke ?? undefined,
		strokeWidth: text.strokeWidth,
		paintFirst: 'stroke',
		strokeLineJoin: 'round',
		strokeLineCap: 'round',
		lineHeight: text.lineHeight,
		textAlign: text.textAlign,
		fontFamily: text.fontFamily,
		editable: true,
		selectable: options.interactive,
		evented: options.interactive,
		lockMovementX: !options.interactive,
		lockMovementY: !options.interactive,
		lockRotation: true,
		lockScalingX: !options.interactive,
		lockScalingY: true,
		hasControls: options.interactive,
		objectCaching: false,
		splitByGrapheme: false,
		originX: 'left',
		originY: 'top',
		...(fabricStyles ? { styles: fabricStyles } : {}),
	});
};

export const getPageTextbox = (object: PageTextObject): Textbox | null => {
	if (object instanceof Group) {
		const found = object.getObjects().find((child) => {
			return child instanceof Textbox;
		});

		return found instanceof Textbox ? found : null;
	}

	return object as Textbox;
};

export const getPageTextRect = (object: PageTextObject): Rect | null => {
	if (!(object instanceof Group)) {
		return null;
	}

	const found = object.getObjects().find((child) => {
		return child instanceof Rect;
	});

	return found instanceof Rect ? found : null;
};

export const getTextBoxStyle = (
	object: PageTextObject,
): TextBoxStyle | null => {
	const rect = getPageTextRect(object);
	const textbox = getPageTextbox(object);

	if (!rect || !textbox) {
		return null;
	}

	const storedPadding = object.get('boxPadding');
	const storedWidth = object.get('boxWidth');
	const storedHeight = object.get('boxHeight');
	const storedAlign = object.get('boxVerticalAlign');
	// Preferir padding guardado: el LayoutManager recentra hijos y textbox.left
	// deja de ser el padding real.
	const padding =
		typeof storedPadding === 'number' && Number.isFinite(storedPadding)
			? Math.max(0, Math.round(storedPadding))
			: Math.max(0, Math.round((textbox.left ?? 0) - (rect.left ?? 0)));
	const width =
		typeof storedWidth === 'number' && Number.isFinite(storedWidth)
			? Math.max(0, Math.round(storedWidth))
			: Math.max(0, Math.round(rect.width ?? 0));
	const height =
		typeof storedHeight === 'number' && Number.isFinite(storedHeight)
			? Math.max(0, Math.round(storedHeight))
			: Math.max(0, Math.round(rect.height ?? 0));

	return {
		fill: toHexColor(rect.fill, DEFAULT_TEXT_BOX.fill),
		stroke: toHexColor(rect.stroke, DEFAULT_TEXT_BOX.stroke),
		strokeWidth:
			normalizeStrokeWidth(rect.strokeWidth) ?? DEFAULT_TEXT_BOX.strokeWidth,
		cornerRadius: Math.max(0, Number(rect.rx) || 0),
		padding,
		width,
		height,
		verticalAlign: normalizeVerticalAlign(storedAlign),
	};
};

export const syncBoxedTextGeometry = (
	object: PageTextObject,
	boxOverride?: TextBoxStyle,
): void => {
	if (!(object instanceof Group)) {
		return;
	}

	const textbox = getPageTextbox(object);
	const rect = getPageTextRect(object);
	const box = boxOverride ?? getTextBoxStyle(object);

	if (!textbox || !rect || !box) {
		return;
	}

	textbox.initDimensions?.();

	const padding = box.padding;
	const verticalAlign = normalizeVerticalAlign(box.verticalAlign);
	const minTextWidth = measureTextContentWidth(textbox);
	const outerWidth = resolveBoxedOuterWidth(box.width, minTextWidth, padding);
	const nextTextWidth = Math.max(1, outerWidth - padding * 2);

	if (Math.round(textbox.width ?? 0) !== nextTextWidth) {
		textbox.set({ width: nextTextWidth });
		textbox.initDimensions?.();
	}

	const textHeight = textbox.height ?? 0;
	const outerHeight = resolveBoxedOuterHeight(box.height, textHeight, padding);
	const textTop = boxedTextTop(
		outerHeight,
		textHeight,
		padding,
		verticalAlign,
	);

	// Preservar posición en canvas: triggerLayout recentra (origin center) y salta.
	const left = object.left ?? 0;
	const top = object.top ?? 0;

	// Coords relativas al centro del Group (convención Fabric tras el layout).
	const stroke = Math.max(0, box.strokeWidth || 0);

	rect.set({
		left: boxedRectOrigin(outerWidth, stroke),
		top: boxedRectOrigin(outerHeight, stroke),
		width: outerWidth,
		height: outerHeight,
		rx: box.cornerRadius,
		ry: box.cornerRadius,
		fill: box.fill,
		stroke: box.stroke,
		strokeWidth: stroke,
	});
	textbox.set({
		left: -outerWidth / 2 + padding,
		top: -outerHeight / 2 + textTop,
	});
	object.set({
		width: outerWidth,
		height: outerHeight,
		left,
		top,
		boxPadding: padding,
		boxWidth: outerWidth,
		boxHeight: outerHeight,
		boxVerticalAlign: verticalAlign,
		dirty: true,
	});
	object.setCoords();
};

/**
 * Handlers laterales (ml/mr): cambian el width de la caja + Textbox.
 */
const resizeBoxedTextWidth = (
	_eventData: TPointerEvent,
	transform: Transform,
	x: number,
	y: number,
): boolean => {
	const target = transform.target;

	if (!(target instanceof Group)) {
		return false;
	}

	const pageText = target as PageTextObject;
	const textbox = getPageTextbox(pageText);
	const box = getTextBoxStyle(pageText);

	if (!textbox || !box) {
		return false;
	}

	const localPoint = controlsUtils.getLocalPoint(
		transform,
		transform.originX,
		transform.originY,
		x,
		y,
	);

	const corner = transform.corner;
	if (
		(corner === 'mr' || corner === 'tr' || corner === 'br') &&
		localPoint.x < 0
	) {
		return false;
	}
	if (
		(corner === 'ml' || corner === 'tl' || corner === 'bl') &&
		localPoint.x > 0
	) {
		return false;
	}

	const strokePadding =
		target.strokeWidth / (target.strokeUniform ? target.scaleX || 1 : 1);
	const centered =
		transform.originX === 'center' && transform.originY === 'center';
	const multiplier = centered ? 2 : 1;
	const minTextWidth = measureTextContentWidth(textbox);
	const nextWidth = resolveBoxedOuterWidth(
		Math.abs((localPoint.x * multiplier) / (target.scaleX || 1)) -
			strokePadding,
		minTextWidth,
		box.padding,
	);
	const prevWidth = Math.round(box.width);

	if (nextWidth === prevWidth) {
		return false;
	}

	syncBoxedTextGeometry(pageText, {
		...box,
		width: nextWidth,
	});

	return true;
};

/** Handlers mt/mb: cambian el alto de la caja (el texto se realinea). */
const resizeBoxedTextHeight = (
	_eventData: TPointerEvent,
	transform: Transform,
	x: number,
	y: number,
): boolean => {
	const target = transform.target;

	if (!(target instanceof Group)) {
		return false;
	}

	const pageText = target as PageTextObject;
	const textbox = getPageTextbox(pageText);
	const box = getTextBoxStyle(pageText);

	if (!textbox || !box) {
		return false;
	}

	const localPoint = controlsUtils.getLocalPoint(
		transform,
		transform.originX,
		transform.originY,
		x,
		y,
	);

	const corner = transform.corner;
	if (
		(corner === 'mb' || corner === 'bl' || corner === 'br') &&
		localPoint.y < 0
	) {
		return false;
	}
	if (
		(corner === 'mt' || corner === 'tl' || corner === 'tr') &&
		localPoint.y > 0
	) {
		return false;
	}

	textbox.initDimensions?.();

	const strokePadding =
		target.strokeWidth / (target.strokeUniform ? target.scaleY || 1 : 1);
	const centered =
		transform.originX === 'center' && transform.originY === 'center';
	const multiplier = centered ? 2 : 1;
	const rawOuterHeight = Math.max(
		1,
		Math.abs((localPoint.y * multiplier) / (target.scaleY || 1)) -
			strokePadding,
	);
	const nextHeight = resolveBoxedOuterHeight(
		rawOuterHeight,
		textbox.height ?? 0,
		box.padding,
	);
	const prevHeight = Math.round(box.height);

	if (nextHeight === prevHeight) {
		return false;
	}

	syncBoxedTextGeometry(pageText, {
		...box,
		height: nextHeight,
	});

	return true;
};

/** Esquinas: ancho + alto en un solo sync. */
const resizeBoxedTextCorner = (
	_eventData: TPointerEvent,
	transform: Transform,
	x: number,
	y: number,
): boolean => {
	const target = transform.target;

	if (!(target instanceof Group)) {
		return false;
	}

	const pageText = target as PageTextObject;
	const textbox = getPageTextbox(pageText);
	const box = getTextBoxStyle(pageText);

	if (!textbox || !box) {
		return false;
	}

	const localPoint = controlsUtils.getLocalPoint(
		transform,
		transform.originX,
		transform.originY,
		x,
		y,
	);
	const corner = transform.corner ?? '';

	if (corner.includes('r') && localPoint.x < 0) {
		return false;
	}
	if (corner.includes('l') && localPoint.x > 0) {
		return false;
	}
	if (corner.includes('b') && localPoint.y < 0) {
		return false;
	}
	if (corner.includes('t') && localPoint.y > 0) {
		return false;
	}

	textbox.initDimensions?.();

	const strokePadX =
		target.strokeWidth / (target.strokeUniform ? target.scaleX || 1 : 1);
	const strokePadY =
		target.strokeWidth / (target.strokeUniform ? target.scaleY || 1 : 1);
	const centered =
		transform.originX === 'center' && transform.originY === 'center';
	const multiplier = centered ? 2 : 1;
	const minTextWidth = measureTextContentWidth(textbox);
	const nextWidth = resolveBoxedOuterWidth(
		Math.abs((localPoint.x * multiplier) / (target.scaleX || 1)) - strokePadX,
		minTextWidth,
		box.padding,
	);
	const nextHeight = resolveBoxedOuterHeight(
		Math.abs((localPoint.y * multiplier) / (target.scaleY || 1)) - strokePadY,
		textbox.height ?? 0,
		box.padding,
	);

	if (
		nextWidth === Math.round(box.width) &&
		nextHeight === Math.round(box.height)
	) {
		return false;
	}

	syncBoxedTextGeometry(pageText, {
		...box,
		width: nextWidth,
		height: nextHeight,
	});

	return true;
};

const onBoxedTextResizeWidth = controlsUtils.wrapWithFireEvent(
	'resizing',
	controlsUtils.wrapWithFixedAnchor(resizeBoxedTextWidth),
);

const onBoxedTextResizeHeight = controlsUtils.wrapWithFireEvent(
	'resizing',
	controlsUtils.wrapWithFixedAnchor(resizeBoxedTextHeight),
);

const onBoxedTextResizeCorner = controlsUtils.wrapWithFireEvent(
	'scaling',
	controlsUtils.wrapWithFixedAnchor(resizeBoxedTextCorner),
);

const CORNER_CURSOR_MAP = [
	'e',
	'se',
	's',
	'sw',
	'w',
	'nw',
	'n',
	'ne',
] as const;

/**
 * Cursor diagonal según control.x/y + ángulo (no oCoords).
 * Tras crear el Group, findCornerQuadrant(oCoords) puede devolver e/w
 * la primera vez y el cursor parece de resize lateral.
 */
export const boxedCornerCursorStyle = (
	controlX: number,
	controlY: number,
	angleDeg: number,
	flipX = false,
	flipY = false,
): string => {
	const vx = controlX * (flipX ? -1 : 1);
	const vy = controlY * (flipY ? -1 : 1);
	const radians = (angleDeg * Math.PI) / 180;
	const x = vx * Math.cos(radians) - vy * Math.sin(radians);
	const y = vx * Math.sin(radians) + vy * Math.cos(radians);
	const twoPi = Math.PI * 2;
	const angle = (Math.atan2(y, x) + twoPi) % twoPi;
	const index = Math.round(angle / (Math.PI / 4)) % 8;

	return `${CORNER_CURSOR_MAP[index]}-resize`;
};

const boxedCornerCursorStyleHandler = (
	_eventData: TPointerEvent,
	control: Control,
	fabricObject: Group,
) => {
	return boxedCornerCursorStyle(
		control.x,
		control.y,
		fabricObject.getTotalAngle(),
		Boolean(fabricObject.flipX),
		Boolean(fabricObject.flipY),
	);
};

export const installBoxedTextControls = (group: Group): void => {
	const rotateControl = group.controls.mtr;

	group.controls = {
		ml: new Control({
			x: -0.5,
			y: 0,
			actionHandler: onBoxedTextResizeWidth,
			cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
			actionName: 'resizing',
		}),
		mr: new Control({
			x: 0.5,
			y: 0,
			actionHandler: onBoxedTextResizeWidth,
			cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
			actionName: 'resizing',
		}),
		mt: new Control({
			x: 0,
			y: -0.5,
			actionHandler: onBoxedTextResizeHeight,
			cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
			actionName: 'resizing',
		}),
		mb: new Control({
			x: 0,
			y: 0.5,
			actionHandler: onBoxedTextResizeHeight,
			cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
			actionName: 'resizing',
		}),
		tl: new Control({
			x: -0.5,
			y: -0.5,
			actionHandler: onBoxedTextResizeCorner,
			cursorStyleHandler: boxedCornerCursorStyleHandler,
			actionName: 'scale',
		}),
		tr: new Control({
			x: 0.5,
			y: -0.5,
			actionHandler: onBoxedTextResizeCorner,
			cursorStyleHandler: boxedCornerCursorStyleHandler,
			actionName: 'scale',
		}),
		bl: new Control({
			x: -0.5,
			y: 0.5,
			actionHandler: onBoxedTextResizeCorner,
			cursorStyleHandler: boxedCornerCursorStyleHandler,
			actionName: 'scale',
		}),
		br: new Control({
			x: 0.5,
			y: 0.5,
			actionHandler: onBoxedTextResizeCorner,
			cursorStyleHandler: boxedCornerCursorStyleHandler,
			actionName: 'scale',
		}),
		...(rotateControl ? { mtr: rotateControl } : {}),
	};
};

const patchFromTextbox = (textbox: Textbox): TextBlockPatch => {
	return {
		content: textbox.text ?? '',
		width: textbox.width ?? 0,
		fontSize: textbox.fontSize ?? DEFAULT_TEXT_FONT_SIZE,
		fontFamily:
			normalizeFontFamilyName(textbox.fontFamily) ?? DEFAULT_TEXT_FONT_FAMILY,
		fill: toHexColor(textbox.fill),
		fontWeight: isBoldWeight(textbox.fontWeight) ? 'bold' : 'normal',
		fontStyle:
			normalizeFontStyle(textbox.fontStyle) === 'italic' ? 'italic' : 'normal',
		underline: Boolean(textbox.underline),
		linethrough: Boolean(textbox.linethrough),
		stroke: toStrokeColor(textbox.stroke),
		strokeWidth:
			normalizeStrokeWidth(textbox.strokeWidth) ?? DEFAULT_TEXT_STROKE_WIDTH,
		lineHeight:
			normalizeLineHeight(textbox.lineHeight) ?? DEFAULT_TEXT_LINE_HEIGHT,
		textAlign: normalizeTextAlign(textbox.textAlign) ?? DEFAULT_TEXT_ALIGN,
		styles: stylesFromFabric(textbox.styles) ?? null,
	};
};

export const textBlockToFabric = (
	text: TextBlock,
	options: TextToFabricOptions = {
		layerId: 'layer',
		interactive: true,
	},
): PageTextObject => {
	const interactive = options.interactive;
	const box = text.box;

	if (!box) {
		const textbox = createInnerTextbox(text, {
			left: text.left,
			top: text.top,
			interactive,
		}) as PageTextObject;

		textbox.set({
			angle: text.angle,
			lockRotation: !interactive,
			objectType: FABRIC_OBJECT_TYPE.Text,
			textId: text.id,
			layerId: options.layerId,
		});

		return textbox;
	}

	// Group seleccionable; Textbox solo editable (vía dblclick / reenvío de eventos).
	const textbox = createInnerTextbox(text, {
		left: box.padding,
		top: box.padding,
		interactive: false,
	});
	textbox.initDimensions?.();

	const minTextWidth = measureTextContentWidth(textbox);
	const textHeight = textbox.height ?? text.fontSize;
	const verticalAlign = normalizeVerticalAlign(box.verticalAlign);
	const outerWidth = resolveBoxedOuterWidth(
		box.width,
		minTextWidth,
		box.padding,
	);
	const outerHeight = resolveBoxedOuterHeight(
		box.height,
		textHeight,
		box.padding,
	);

	const rect = new Rect({
		left: 0,
		top: 0,
		width: outerWidth,
		height: outerHeight,
		rx: box.cornerRadius,
		ry: box.cornerRadius,
		fill: box.fill,
		stroke: box.stroke,
		strokeWidth: box.strokeWidth,
		originX: 'left',
		originY: 'top',
		selectable: false,
		evented: false,
		objectCaching: false,
	});

	const group = new Group([rect, textbox], {
		left: text.left,
		top: text.top,
		angle: text.angle,
		// Seleccionar el Group entero (no hijos): evita que el stroke vea un target sin objectType.
		subTargetCheck: false,
		interactive: false,
		selectable: interactive,
		evented: interactive,
		lockMovementX: !interactive,
		lockMovementY: !interactive,
		lockRotation: !interactive,
		// Igual que Textbox: false en idle para que ml/mr/mt/mb no queden not-allowed.
		lockScalingX: !interactive,
		lockScalingY: !interactive,
		hasControls: interactive,
		objectCaching: false,
		originX: 'left',
		originY: 'top',
	}) as PageTextObject;

	installBoxedTextControls(group as Group);

	const boxedGroup = group as Group;

	boxedGroup.set({
		objectType: FABRIC_OBJECT_TYPE.Text,
		textId: text.id,
		layerId: options.layerId,
		boxPadding: box.padding,
		boxWidth: outerWidth,
		boxHeight: outerHeight,
		boxVerticalAlign: verticalAlign,
	});

	// Evita que cambios en hijos (texto/width) disparen layout y recentren el Group.
	boxedGroup.layoutManager.unsubscribeTargets({
		target: boxedGroup,
		targets: boxedGroup.getObjects(),
	});

	// Normaliza hijos al centro del Group sin desplazar left/top.
	syncBoxedTextGeometry(group, {
		...box,
		width: outerWidth,
		height: outerHeight,
		verticalAlign,
	});

	return group;
};

export const textBlockFromFabric = (object: PageTextObject): TextBlockPatch => {
	const textbox = getPageTextbox(object);

	if (!textbox) {
		return {};
	}

	const patch = patchFromTextbox(textbox);
	const box = getTextBoxStyle(object);

	return {
		...patch,
		left: object.left ?? 0,
		top: object.top ?? 0,
		angle: object.angle ?? 0,
		box,
	};
};

export const applyTextBoxStyle = (
	object: PageTextObject,
	next: Partial<TextBoxStyle>,
): void => {
	const current = getTextBoxStyle(object);

	if (!current) {
		return;
	}

	syncBoxedTextGeometry(object, {
		...current,
		...next,
	});
};

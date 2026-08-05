import { Textbox } from 'fabric';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import {
	isBoldWeight,
	normalizeFontStyle,
	stylesFromFabric,
	stylesToFabric,
	toHexColor,
} from '@/lib/fabric/textStyles';
import {
	DEFAULT_TEXT_FONT_SIZE,
	type TextBlock,
} from '@/models/TextBlock';
import type { PageTextObject } from '@/types/fabric';
import type { TextBlockPatch } from '@/types/page';

type TextToFabricOptions = {
	layerId: string;
	interactive: boolean;
};

export const textBlockToFabric = (
	text: TextBlock,
	options: TextToFabricOptions = {
		layerId: 'layer',
		interactive: true,
	},
): PageTextObject => {
	const interactive = options.interactive;
	const fabricStyles = stylesToFabric(text.styles);
	const textbox = new Textbox(text.content, {
		left: text.left,
		top: text.top,
		width: text.width,
		fontSize: text.fontSize,
		fill: text.fill,
		fontWeight: text.fontWeight,
		fontStyle: text.fontStyle,
		underline: text.underline,
		linethrough: text.linethrough,
		angle: text.angle,
		fontFamily: 'Arial, sans-serif',
		editable: true,
		selectable: interactive,
		evented: interactive,
		lockMovementX: !interactive,
		lockMovementY: !interactive,
		lockRotation: !interactive,
		lockScalingX: !interactive,
		lockScalingY: true,
		hasControls: interactive,
		objectCaching: false,
		splitByGrapheme: false,
		...(fabricStyles ? { styles: fabricStyles } : {}),
	}) as PageTextObject;

	textbox.set({
		objectType: FABRIC_OBJECT_TYPE.Text,
		textId: text.id,
		layerId: options.layerId,
	});

	return textbox;
};

export const textBlockFromFabric = (textbox: PageTextObject): TextBlockPatch => {
	return {
		content: textbox.text ?? '',
		left: textbox.left ?? 0,
		top: textbox.top ?? 0,
		width: textbox.width ?? 0,
		fontSize: textbox.fontSize ?? DEFAULT_TEXT_FONT_SIZE,
		angle: textbox.angle ?? 0,
		fill: toHexColor(textbox.fill),
		fontWeight: isBoldWeight(textbox.fontWeight) ? 'bold' : 'normal',
		fontStyle:
			normalizeFontStyle(textbox.fontStyle) === 'italic' ? 'italic' : 'normal',
		underline: Boolean(textbox.underline),
		linethrough: Boolean(textbox.linethrough),
		styles: stylesFromFabric(textbox.styles) ?? null,
	};
};

import type { Shape } from '@/models/Shape';
import type { ShapeImage } from '@/models/ShapeImage';
import type { TextBlock } from '@/models/TextBlock';
import type { Ref } from 'vue';
import type { Layer } from '@/models/Layer';

export type PagePoint = {
	x: number;
	y: number;
};

export type TextFontWeight = 'normal' | 'bold';
export type TextFontStyle = 'normal' | 'italic';
export type TextTextAlign =
	| 'left'
	| 'center'
	| 'right'
	| 'justify'
	| 'justify-left'
	| 'justify-center'
	| 'justify-right';

/** Ancla espacial del texto respecto a la página (rejilla 3×3). */
export type PageTextAnchor =
	| 'top-left'
	| 'top-center'
	| 'top-right'
	| 'middle-left'
	| 'middle-center'
	| 'middle-right'
	| 'bottom-left'
	| 'bottom-center'
	| 'bottom-right';

export type TextCharStyle = {
	fill?: string;
	fontSize?: number;
	fontFamily?: string;
	fontWeight?: TextFontWeight;
	fontStyle?: TextFontStyle;
	underline?: boolean;
	linethrough?: boolean;
	stroke?: string;
	strokeWidth?: number;
	lineHeight?: number;
};

export type TextStylesJSON = {
	[lineIndex: string]: {
		[charIndex: string]: TextCharStyle;
	};
};

export type TextBlockJSON = {
	id: string;
	content: string;
	left: number;
	top: number;
	width: number;
	fontSize: number;
	fontFamily?: string;
	fill: string;
	fontWeight?: TextFontWeight;
	fontStyle?: TextFontStyle;
	underline?: boolean;
	linethrough?: boolean;
	stroke?: string | null;
	strokeWidth?: number;
	lineHeight?: number;
	textAlign?: TextTextAlign;
	angle?: number;
	styles?: TextStylesJSON | null;
};

export type TextBlockPatch = Partial<Omit<TextBlockJSON, 'id'>>;

export type PagePreviewText = {
	lines: string[];
	x: number;
	y: number;
	fontSize: number;
	fontFamily: string;
	lineHeight: number;
	fill: string;
	fontWeight: TextFontWeight;
	fontStyle: TextFontStyle;
	underline: boolean;
	linethrough: boolean;
	stroke: string | null;
	strokeWidth: number;
	textAlign: TextTextAlign;
	width: number;
	angle: number;
	originX: number;
	originY: number;
};

export type PreviewTextMeasureStyle = {
	fontSize: number;
	fontWeight?: string;
	fontStyle?: string;
};

export type PageRect = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export type PageAlignSize = {
	width: number;
	height: number;
};

export type PageAlignableText = {
	left?: number;
	top?: number;
	set: (props: { left: number; top: number }) => unknown;
	setCoords?: () => unknown;
	getBoundingRect: () => PageRect;
};

export type ShapeImageJSON = {
	src: string;
	left: number;
	top: number;
	scaleX: number;
	scaleY: number;
	originX: 'center' | 'left';
	originY: 'center' | 'top';
	width: number;
	height: number;
	angle?: number;
	grayscale?: boolean;
};

export type ShapeJSON = {
	id: string;
	points: PagePoint[];
	strokeWidth: number;
	image: ShapeImageJSON | null;
};

export type ShapeLike =
	| (Pick<ShapeJSON, 'points' | 'strokeWidth' | 'image'> & {
			whiteFill?: boolean;
	  })
	| Shape;

export type PagePreviewPanel = {
	points: string;
	strokeWidth: number;
	whiteFill: boolean;
};

export type PagePreviewImage = {
	href: string;
	x: number;
	y: number;
	width: number;
	height: number;
	angle: number;
	originX: number;
	originY: number;
	clipPoints: string;
	grayscale: boolean;
};

export type PagePreviewModel = {
	width: number;
	height: number;
	panels: PagePreviewPanel[];
	images: PagePreviewImage[];
	texts: PagePreviewText[];
};

export type ContentResetDeps = {
	contentResetEpoch: Ref<number>;
	applyReset: () => Promise<void>;
	discardSelection?: () => void;
};

export type PageRotateDirection = 'clockwise' | 'counterclockwise';

export type PageMarginSide =
	| 'marginTop'
	| 'marginRight'
	| 'marginBottom'
	| 'marginLeft';

export type PageMargins = Record<PageMarginSide, number>;

export type ShapeImageValue = {
	src: string;
	left: number;
	top: number;
	scaleX: number;
	scaleY: number;
	originX?: 'center' | 'left';
	originY?: 'center' | 'top';
	width?: number;
	height?: number;
	angle?: number;
	grayscale?: boolean;
};

export type ShapeValue = {
	id: string;
	points: PagePoint[];
	strokeWidth: number;
	image?: ShapeImage | null;
	whiteFill?: boolean;
};

export type LayerValue = {
	id: string;
	name: string;
	visible?: boolean;
	shapes?: Shape[];
	texts?: TextBlock[];
	gridCols?: number;
	gridRows?: number;
	strokeWidth?: number;
};

export type ResetLayerOptions = {
	gridCols?: number;
	gridRows?: number;
	margins?: PageMargins;
	strokeWidth?: number;
};

export type PageValue = {
	id: string;
	name: string;
	width: number;
	height: number;
	layers?: Layer[];
	activeLayerId?: string;
};


import type { Shape } from '@/models/Shape';
import type { ShapeImage } from '@/models/ShapeImage';

export type PagePoint = {
	x: number;
	y: number;
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
};

export type ShapeJSON = {
	id: string;
	points: PagePoint[];
	strokeWidth: number;
	image: ShapeImageJSON | null;
};

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
};

export type ShapeValue = {
	id: string;
	points: PagePoint[];
	strokeWidth: number;
	image?: ShapeImage | null;
};

export type PageValue = {
	id: string;
	name: string;
	width: number;
	height: number;
	shapes?: Shape[];
	gridCols?: number;
	gridRows?: number;
	marginTop?: number;
	marginRight?: number;
	marginBottom?: number;
	marginLeft?: number;
	strokeWidth?: number;
};

export interface PageJSON {
	id: string;
	name: string;
	width: number;
	height: number;
	shapes: ShapeJSON[];
	gridCols?: number;
	gridRows?: number;
	marginTop?: number;
	marginRight?: number;
	marginBottom?: number;
	marginLeft?: number;
	strokeWidth?: number;
}

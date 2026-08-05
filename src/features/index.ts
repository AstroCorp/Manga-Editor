import type { CanvasFeature } from '@/features/types';
import { contentResetFeature } from '@/features/content-reset';
import { gridHoverFeature } from '@/features/grid-hover';
import { guidesFeature } from '@/features/guides';
import { imageDropFeature } from '@/features/image-drop';
import { selectionFeature } from '@/features/selection';
import { shapeMenuFeature } from '@/features/shape-menu';
import { strokeFeature } from '@/features/stroke';
import { textFeature } from '@/features/text';
import { textColorFeature } from '@/features/text-color';
import { zoomFeature } from '@/features/zoom';

/**
 * Orden de instalación: stroke debe ir antes de features que usan el actions bus.
 */
export const canvasFeatures: CanvasFeature[] = [
	zoomFeature,
	guidesFeature,
	strokeFeature,
	selectionFeature,
	textFeature,
	textColorFeature,
	imageDropFeature,
	gridHoverFeature,
	shapeMenuFeature,
	contentResetFeature,
];

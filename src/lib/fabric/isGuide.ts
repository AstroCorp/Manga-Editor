import type { FabricObject } from 'fabric';
import type { GuideMarkedObject } from '@/types/fabric';

export const isGuide = (object: FabricObject): boolean => {
	const marked = object as GuideMarkedObject;
	return Boolean(marked.isGuide || object.get('isGuide'));
};

/** Solo la imagen raster de puntos (no el draft/rubber band). */
export const isGridGuide = (object: FabricObject): boolean => {
	const marked = object as GuideMarkedObject;

	return Boolean(marked.isGridGuide || object.get('isGridGuide'));
};

export const isPanel = (object: FabricObject): boolean => {
	return object.get('objectType') === 'panel';
};

export const getPanelId = (object: FabricObject): string | undefined => {
	const value = object.get('panelId');

	return typeof value === 'string' && value.length > 0 ? value : undefined;
};

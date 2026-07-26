import type { Canvas, FabricObject } from 'fabric';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import type { GuideMarkedObject, PanelLikeObject } from '@/types/fabric';

export const isGuide = (object: FabricObject): boolean => {
	const marked = object as GuideMarkedObject;

	return Boolean(marked.isGuide || object.get('isGuide'));
};

/** Solo la imagen raster de puntos (no el draft/rubber band (línea azul discontinua)). */
export const isGridGuide = (object: FabricObject): boolean => {
	const marked = object as GuideMarkedObject;

	return Boolean(marked.isGridGuide || object.get('isGridGuide'));
};

export const isPanel = (object: FabricObject): boolean => {
	return object.get('objectType') === FABRIC_OBJECT_TYPE.Panel;
};

export const isPanelImage = (object: FabricObject): boolean => {
	return object.get('objectType') === FABRIC_OBJECT_TYPE.PanelImage;
};

export const getPanelId = (object: FabricObject): string | undefined => {
	const value = object.get('panelId');

	return typeof value === 'string' && value.length > 0 ? value : undefined;
};

export const findPanelById = (canvas: Canvas, panelId: string): PanelLikeObject | null => {
	return (
		(canvas.getObjects().find((object) => {
			return isPanel(object) && getPanelId(object) === panelId;
		}) as PanelLikeObject | undefined) ?? null
	);
};

export const collectPanelIdsWithImage = (canvas: Canvas): Set<string> => {
	const ids = new Set<string>();

	canvas.getObjects().forEach((object) => {
		if (!isPanelImage(object)) {
			return;
		}

		const panelId = getPanelId(object);

		if (panelId) {
			ids.add(panelId);
		}
	});

	return ids;
};

/** Quita del canvas todos los objetos ligados a un panelId. */
export const removeObjectsByPanelId = (canvas: Canvas, panelId: string) => {
	canvas
		.getObjects()
		.filter((object) => {
			return getPanelId(object) === panelId;
		})
		.forEach((object) => {
			canvas.remove(object);
		});
};

/**
 * Guías al fondo; paneles encima de imágenes.
 * Reordena en un solo paso (evita N bringObjectToFront).
 */
export const stackPageContent = (canvas: Canvas) => {
	const objects = canvas.getObjects().slice();
	const guides = objects.filter((object) => {
		return isGuide(object);
	});
	const content = objects.filter((object) => {
		return !isGuide(object);
	});
	const images = content.filter((object) => {
		return isPanelImage(object);
	});
	const panels = content.filter((object) => {
		return isPanel(object);
	});
	const other = content.filter((object) => {
		return !isPanel(object) && !isPanelImage(object);
	});
	const ordered = [...guides, ...other, ...images, ...panels];

	ordered.forEach((object, index) => {
		canvas.moveObjectTo(object, index);
	});
};

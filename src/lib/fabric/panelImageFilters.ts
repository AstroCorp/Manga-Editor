import { filters, type FabricImage } from 'fabric';

export const hasGrayscaleFilter = (image: FabricImage): boolean => {
	return (image.filters ?? []).some((filter) => filter?.type === 'Grayscale');
};

/** Activa o quita el filtro B/N de Fabric y regenera la textura. */
export const setGrayscaleFilter = (image: FabricImage, enabled: boolean): void => {
	const current = image.filters ?? [];
	const withoutGrayscale = current.filter((filter) => filter?.type !== 'Grayscale');

	image.filters = enabled
		? [...withoutGrayscale, new filters.Grayscale()]
		: withoutGrayscale;

	image.applyFilters();
};

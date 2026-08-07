import type { Shape } from '@/models/Shape';
import type { TextBlock } from '@/models/TextBlock';
import type { LayerElementKind } from '@/stores/selection';

export type LayerElementListItem = {
	kind: LayerElementKind;
	id: string;
	label: string;
	icon: string;
};

type LayerElementsSource = {
	shapes: Shape[];
	texts: TextBlock[];
};

const truncateLabel = (value: string, max = 28): string => {
	const trimmed = value.trim();

	if (!trimmed) {
		return 'Text';
	}

	if (trimmed.length <= max) {
		return trimmed;
	}

	return `${trimmed.slice(0, max - 1)}…`;
};

/**
 * Elementos de una capa, arriba = encima (mismo criterio que el stack de capas).
 */
export const listLayerElements = (
	layer: LayerElementsSource,
): LayerElementListItem[] => {
	const shapes: LayerElementListItem[] = layer.shapes.map((shape, index) => {
		const hasImage = Boolean(shape.image);

		return {
			kind: 'shape',
			id: shape.id,
			label: hasImage
				? `Panel ${index + 1} (with image)`
				: `Panel ${index + 1}`,
			icon: hasImage
				? 'fluent:image-24-regular'
				: 'fluent:hexagon-24-regular',
		};
	});

	const texts: LayerElementListItem[] = layer.texts.map((text) => {
		return {
			kind: 'text',
			id: text.id,
			label: truncateLabel(text.content),
			icon: text.box
				? 'fluent:textbox-align-bottom-24-regular'
				: 'fluent:text-t-24-regular',
		};
	});

	return [...shapes, ...texts].reverse();
};

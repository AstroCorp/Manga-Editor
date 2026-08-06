import type { PageTextAnchor } from '@/types/page';

export const PAGE_TEXT_ANCHORS = [
	'top-left',
	'top-center',
	'top-right',
	'middle-left',
	'middle-center',
	'middle-right',
	'bottom-left',
	'bottom-center',
	'bottom-right',
] as const satisfies ReadonlyArray<PageTextAnchor>;

export const PAGE_TEXT_ANCHOR_LABELS: Record<PageTextAnchor, string> = {
	'top-left': 'Top left',
	'top-center': 'Top center',
	'top-right': 'Top right',
	'middle-left': 'Middle left',
	'middle-center': 'Center',
	'middle-right': 'Middle right',
	'bottom-left': 'Bottom left',
	'bottom-center': 'Bottom center',
	'bottom-right': 'Bottom right',
};

export const PAGE_TEXT_ANCHOR_OPTIONS: ReadonlyArray<{
	value: PageTextAnchor;
	label: string;
}> = PAGE_TEXT_ANCHORS.map((value) => {
	return {
		value,
		label: PAGE_TEXT_ANCHOR_LABELS[value],
	};
});

export const isPageTextAnchor = (value: unknown): value is PageTextAnchor => {
	return (
		typeof value === 'string' &&
		(PAGE_TEXT_ANCHORS as ReadonlyArray<string>).includes(value)
	);
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
	getBoundingRect: () => {
		left: number;
		top: number;
		width: number;
		height: number;
	};
};

const horizontalTarget = (
	anchor: PageTextAnchor,
	pageWidth: number,
	boundsWidth: number,
): number => {
	if (anchor.endsWith('left')) {
		return 0;
	}

	if (anchor.endsWith('right')) {
		return pageWidth - boundsWidth;
	}

	return (pageWidth - boundsWidth) / 2;
};

const verticalTarget = (
	anchor: PageTextAnchor,
	pageHeight: number,
	boundsHeight: number,
): number => {
	if (anchor.startsWith('top')) {
		return 0;
	}

	if (anchor.startsWith('bottom')) {
		return pageHeight - boundsHeight;
	}

	return (pageHeight - boundsHeight) / 2;
};

/**
 * Mueve el texto para alinear su AABB con uno de los 9 anclajes de la página.
 * Preserva ángulo y tamaño; solo ajusta left/top.
 */
export const alignTextToPage = (
	textbox: PageAlignableText,
	page: PageAlignSize,
	anchor: PageTextAnchor,
) => {
	textbox.setCoords?.();

	const bounds = textbox.getBoundingRect();
	const targetLeft = horizontalTarget(anchor, page.width, bounds.width);
	const targetTop = verticalTarget(anchor, page.height, bounds.height);
	const nextLeft = (textbox.left ?? 0) + (targetLeft - bounds.left);
	const nextTop = (textbox.top ?? 0) + (targetTop - bounds.top);

	textbox.set({
		left: nextLeft,
		top: nextTop,
	});
	textbox.setCoords?.();
};

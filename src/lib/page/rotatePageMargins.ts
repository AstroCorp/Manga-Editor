import type { PageMargins, PageRotateDirection } from '@/types/page';

/**
 * Ciclo de márgenes al rotar la página.
 * clockwise: top → right → bottom → left
 */
export const rotatePageMargins = (
	margins: PageMargins,
	direction: PageRotateDirection,
): PageMargins => {
	const { marginTop, marginRight, marginBottom, marginLeft } = margins;

	if (direction === 'clockwise') {
		return {
			marginTop: marginLeft,
			marginRight: marginTop,
			marginBottom: marginRight,
			marginLeft: marginBottom,
		};
	}

	return {
		marginTop: marginRight,
		marginRight: marginBottom,
		marginBottom: marginLeft,
		marginLeft: marginTop,
	};
};

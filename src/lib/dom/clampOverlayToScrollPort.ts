import type { OverlayScrollClampInput } from '@/types/ui';

const SCROLL_OVERFLOW_RE = /(auto|scroll|overlay)/;

export const findScrollParent = (el: Element | null): HTMLElement | null => {
	let node = el?.parentElement ?? null;

	while (node) {
		const style = getComputedStyle(node);
		const overflowX = style.overflowX || style.overflow;
		const overflowY = style.overflowY || style.overflow;

		if (
			SCROLL_OVERFLOW_RE.test(overflowX) ||
			SCROLL_OVERFLOW_RE.test(overflowY)
		) {
			return node;
		}

		node = node.parentElement;
	}

	return null;
};

export const computeOverlayScrollClamp = (
	input: OverlayScrollClampInput,
): { x: number; y: number } => {
	const padding = input.padding ?? 8;
	const portLeft = input.portRect.left + padding;
	const portRight = input.portRect.right - padding;
	const portTop = input.portRect.top + padding;
	const portBottom = input.portRect.bottom - padding;
	const portWidth = Math.max(0, portRight - portLeft);
	const portHeight = Math.max(0, portBottom - portTop);

	const halfW = input.overlayWidth / 2;
	const centerX = input.stageRect.left + input.anchorLeft;
	let x = 0;

	if (input.overlayWidth >= portWidth) {
		x = portLeft + halfW - centerX;
	} else {
		const minCenter = portLeft + halfW;
		const maxCenter = portRight - halfW;

		if (centerX < minCenter) {
			x = minCenter - centerX;
		} else if (centerX > maxCenter) {
			x = maxCenter - centerX;
		}
	}

	const anchorY = input.stageRect.top + input.anchorTop;
	const top =
		input.placement === 'above'
			? anchorY - input.overlayHeight
			: anchorY;
	const bottom = top + input.overlayHeight;
	let y = 0;

	if (input.overlayHeight >= portHeight) {
		y = portTop - top;
	} else if (top < portTop) {
		y = portTop - top;
	} else if (bottom > portBottom) {
		y = portBottom - bottom;
	}

	return { x, y };
};

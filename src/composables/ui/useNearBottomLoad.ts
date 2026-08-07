import {
	useEventListener,
	useIntersectionObserver,
} from '@vueuse/core';
import { ref } from 'vue';

const DEFAULT_DISTANCE = 80;

type NearBottomLoadOptions = {
	/** false → no dispara carga (p. ej. loading / sin más ítems). */
	canLoadMore: () => boolean;
	onLoadMore: () => void;
	/**
	 * No cargar hasta `notifyLayoutReady()` (masonry a media reconstrucción).
	 */
	waitForLayoutReady?: boolean;
	distance?: number;
};

/**
 * Carga al acercarse al final de un contenedor con scroll (sentinel + scroll).
 * No rellena automáticamente solo porque el contenido sea más bajo que el viewport
 * (salvo que el sentinel quede visible con layout ya estable).
 */
export const useNearBottomLoad = (options: NearBottomLoadOptions) => {
	const distance = options.distance ?? DEFAULT_DISTANCE;
	const waitForLayoutReady = options.waitForLayoutReady ?? false;

	const scrollEl = ref<HTMLElement | null>(null);
	const sentinelEl = ref<HTMLElement | null>(null);
	const layoutReady = ref(!waitForLayoutReady);
	const loading = ref(false);

	const notifyLayoutReady = () => {
		layoutReady.value = true;
	};

	const tryLoadMore = () => {
		if (
			loading.value ||
			!layoutReady.value ||
			!options.canLoadMore()
		) {
			return false;
		}

		loading.value = true;

		if (waitForLayoutReady) {
			layoutReady.value = false;
		}

		try {
			options.onLoadMore();

			return true;
		} finally {
			loading.value = false;
		}
	};

	useIntersectionObserver(
		sentinelEl,
		([entry]) => {
			if (!entry?.isIntersecting) {
				return;
			}

			tryLoadMore();
		},
		{
			root: scrollEl,
			rootMargin: `${distance}px`,
			threshold: 0,
		},
	);

	useEventListener(
		scrollEl,
		'scroll',
		() => {
			const el = scrollEl.value;

			if (!el) {
				return;
			}

			if (el.scrollHeight - el.scrollTop - el.clientHeight > distance) {
				return;
			}

			tryLoadMore();
		},
		{ passive: true },
	);

	const suspendUntilLayoutReady = () => {
		if (waitForLayoutReady) {
			layoutReady.value = false;
		}
	};

	return {
		scrollEl,
		sentinelEl,
		layoutReady,
		notifyLayoutReady,
		suspendUntilLayoutReady,
		tryLoadMore,
	};
};

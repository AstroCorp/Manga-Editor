import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

const intersectionCbs: Array<(entries: Array<{ isIntersecting: boolean }>) => void> =
	[];

vi.mock('@vueuse/core', () => {
	return {
		useEventListener: vi.fn(),
		useIntersectionObserver: (
			_el: unknown,
			cb: (entries: Array<{ isIntersecting: boolean }>) => void,
		) => {
			intersectionCbs.push(cb);

			return { stop: vi.fn() };
		},
	};
});

describe('useNearBottomLoad', () => {
	beforeEach(() => {
		intersectionCbs.length = 0;
		vi.resetModules();
	});

	it('does not load until notifyLayoutReady when waitForLayoutReady', async () => {
		const { useNearBottomLoad } = await import(
			'@/composables/ui/useNearBottomLoad'
		);
		const onLoadMore = vi.fn();
		const canLoadMore = ref(true);

		const api = useNearBottomLoad({
			waitForLayoutReady: true,
			canLoadMore: () => {
				return canLoadMore.value;
			},
			onLoadMore,
		});

		expect(api.tryLoadMore()).toBe(false);
		expect(onLoadMore).not.toHaveBeenCalled();

		api.notifyLayoutReady();
		expect(api.tryLoadMore()).toBe(true);
		expect(onLoadMore).toHaveBeenCalledOnce();
		expect(api.layoutReady.value).toBe(false);
	});

	it('ignores intersecting sentinel while layout is not ready', async () => {
		const { useNearBottomLoad } = await import(
			'@/composables/ui/useNearBottomLoad'
		);
		const onLoadMore = vi.fn();

		useNearBottomLoad({
			waitForLayoutReady: true,
			canLoadMore: () => {
				return true;
			},
			onLoadMore,
		});

		intersectionCbs[0]?.([{ isIntersecting: true }]);
		expect(onLoadMore).not.toHaveBeenCalled();
	});
});

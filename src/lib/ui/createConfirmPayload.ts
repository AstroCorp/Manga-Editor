import { shallowRef } from 'vue';

/**
 * Flujo request → ConfirmModal → confirm/cancel con payload tipado.
 * Vive en lib (no composable) para no anidar composables.
 */
export const createConfirmPayload = <T>() => {
	const pending = shallowRef<T | null>(null);

	const request = (value: T) => {
		pending.value = value;
	};

	const cancel = () => {
		pending.value = null;
	};

	const confirm = (run: (value: T) => void) => {
		const value = pending.value;

		pending.value = null;

		if (value === null) {
			return;
		}

		run(value);
	};

	return {
		pending,
		request,
		cancel,
		confirm,
	};
};

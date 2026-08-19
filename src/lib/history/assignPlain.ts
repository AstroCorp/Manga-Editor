const isPlainObject = (value: unknown): value is Record<string, unknown> => {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Copia `next` sobre un draft de Immer campo a campo.
 * Así los parches son finos (no un replace del documento entero).
 */
export const assignPlain = (draft: unknown, next: unknown): void => {
	if (draft === next) {
		return;
	}

	if (Array.isArray(draft) && Array.isArray(next)) {
		for (let index = 0; index < next.length; index += 1) {
			const nextItem = next[index];
			const draftItem = draft[index];

			if (
				index < draft.length &&
				isPlainObject(draftItem) &&
				isPlainObject(nextItem)
			) {
				assignPlain(draftItem, nextItem);
			} else {
				draft[index] = nextItem;
			}
		}

		if (draft.length > next.length) {
			draft.length = next.length;
		}

		return;
	}

	if (!isPlainObject(draft) || !isPlainObject(next)) {
		return;
	}

	Object.keys(next).forEach((key) => {
		const nextValue = next[key];
		const draftValue = draft[key];

		if (isPlainObject(draftValue) && isPlainObject(nextValue)) {
			assignPlain(draftValue, nextValue);

			return;
		}

		if (Array.isArray(draftValue) && Array.isArray(nextValue)) {
			assignPlain(draftValue, nextValue);

			return;
		}

		if (draftValue !== nextValue) {
			draft[key] = nextValue;
		}
	});

	Object.keys(draft).forEach((key) => {
		if (!(key in next)) {
			delete draft[key];
		}
	});
};

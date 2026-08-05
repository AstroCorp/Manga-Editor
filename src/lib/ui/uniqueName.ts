/** Clave de comparación: trim + minúsculas. */
export const normalizeNameKey = (name: string): string => {
	return name.trim().toLocaleLowerCase();
};

/**
 * true si `desired` ya está usado por otro nombre de la lista.
 * `except` permite ignorar el nombre actual al renombrar.
 */
export const isDuplicateName = (
	desired: string,
	taken: Iterable<string>,
	except?: string,
): boolean => {
	const key = normalizeNameKey(desired);

	if (!key) {
		return true;
	}

	const exceptKey = except ? normalizeNameKey(except) : null;

	for (const name of taken) {
		const current = normalizeNameKey(name);

		if (exceptKey && current === exceptKey) {
			continue;
		}

		if (current === key) {
			return true;
		}
	}

	return false;
};

/** Devuelve `desired` o `desired (2)`, `(3)`, … hasta que sea único. */
export const findUniqueName = (
	desired: string,
	taken: Iterable<string>,
): string => {
	const trimmed = desired.trim();
	const base = trimmed.length > 0 ? trimmed : 'Untitled';
	const takenKeys = new Set(
		[...taken].map((name) => {
			return normalizeNameKey(name);
		}),
	);

	if (!takenKeys.has(normalizeNameKey(base))) {
		return base;
	}

	let suffix = 2;

	while (takenKeys.has(normalizeNameKey(`${base} (${suffix})`))) {
		suffix += 1;
	}

	return `${base} (${suffix})`;
};

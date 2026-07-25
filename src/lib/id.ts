import { v4 as uuidv4 } from 'uuid';

/** Identificador único (UUID) para paneles, páginas y documento. */
export const createId = (): string => {
	return uuidv4();
};

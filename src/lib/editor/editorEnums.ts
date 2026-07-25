import type { ExportImageFormat, ThemePreference } from '@/types/editor';
import type { SidebarTab } from '@/types/sidebar';

export const EXPORT_IMAGE_FORMAT = {
	Png: 'png',
	Jpeg: 'jpeg',
} as const satisfies Record<string, ExportImageFormat>;

export const EXPORT_IMAGE_EXTENSION = {
	[EXPORT_IMAGE_FORMAT.Png]: 'png',
	[EXPORT_IMAGE_FORMAT.Jpeg]: 'jpg',
} as const satisfies Record<ExportImageFormat, string>;

export const exportImageExtension = (format: ExportImageFormat): string => {
	return EXPORT_IMAGE_EXTENSION[format];
};

export const THEME_PREFERENCE = {
	Auto: 'auto',
	Light: 'light',
	Dark: 'dark',
} as const satisfies Record<string, ThemePreference>;

export const SIDEBAR_TAB = {
	Config: 'config',
	Layouts: 'layouts',
} as const satisfies Record<string, SidebarTab>;

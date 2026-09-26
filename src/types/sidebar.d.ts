import type { Component } from 'vue';

export type SidebarTab = 'config' | 'layouts' | 'layers' | 'texts' | 'element';

export type SidebarTabDef = {
	id: SidebarTab;
	label: string;
	icon: string;
	panel: Component;
};

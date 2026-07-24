import type { Component } from 'vue';

export type SidebarTab = 'config' | 'layouts';

export type SidebarTabDef = {
	id: SidebarTab;
	label: string;
	icon: string;
	panel: Component;
};

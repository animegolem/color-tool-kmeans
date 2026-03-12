import { writable } from 'svelte/store';

export type View = 'home' | 'values' | 'exports' | 'settings';

export const currentView = writable<View>('home');
export const libraryDrawerOpen = writable<boolean>(false);
export const navCollapsed = writable<boolean>(false);
export const narrowMode = writable<boolean>(false);

export function setView(view: View) {
  currentView.set(view);
}

"use client";

/**
 * In-browser store for the preview: the module tree lives here so the header
 * "Add item" dialog and the module pages share it. It survives client-side
 * navigation but resets on reload (nothing is written to the database).
 */
import { useSyncExternalStore } from "react";
import { demoFloors, demoModules, type PModule, type PRoom } from "./data";

export type PreviewState = { rooms: PRoom[]; modules: PModule[] };

const EMPTY: PreviewState = { rooms: [], modules: [] };
let state: PreviewState | null = null;
const listeners = new Set<() => void>();

function ensure(): PreviewState {
  if (!state) {
    const rooms = demoFloors()[0].rooms;
    state = { rooms, modules: demoModules(rooms) };
  }
  return state;
}

export function getPreview(): PreviewState {
  return ensure();
}

export function setPreviewModules(fn: (modules: PModule[]) => PModule[]): void {
  const s = ensure();
  state = { ...s, modules: fn(s.modules) };
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePreview(): PreviewState {
  return useSyncExternalStore(subscribe, getPreview, () => EMPTY);
}

/** URL-safe, unique module id from a name ("Home office" -> "home-office"). */
export function moduleSlug(name: string, taken: readonly string[]): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "module";
  let slug = base;
  for (let i = 2; taken.includes(slug); i++) slug = `${base}-${i}`;
  return slug;
}

"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { AddItemDialog } from "./add-item-dialog";

export type AddItemKind = "task" | "subtask" | "module";

type AddItemContextValue = { openAddItem: (kind?: AddItemKind) => void };

const AddItemContext = createContext<AddItemContextValue | null>(null);

/** Owns the single Add item dialog so any button on any page can open it. */
export function AddItemProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<AddItemKind>("task");

  const openAddItem = (next: AddItemKind = "task") => {
    setKind(next);
    setOpen(true);
  };

  return (
    <AddItemContext.Provider value={{ openAddItem }}>
      {children}
      <AddItemDialog open={open} onOpenChange={setOpen} kind={kind} onKindChange={setKind} />
    </AddItemContext.Provider>
  );
}

export function useAddItem(): AddItemContextValue {
  const value = useContext(AddItemContext);
  if (!value) throw new Error("useAddItem must be used inside <AddItemProvider>");
  return value;
}

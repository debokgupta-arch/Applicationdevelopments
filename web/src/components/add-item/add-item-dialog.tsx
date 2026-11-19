"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { copy } from "@/lib/copy";
import { node } from "@/lib/preview/data";
import { getPreview, moduleSlug, setPreviewModules } from "@/lib/preview/store";
import { updateNode } from "@/lib/preview/tree";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/kit/field";
import { ResponsiveDialog } from "@/components/kit/responsive-dialog";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { Select } from "@/components/preview/ui";
import type { AddItemKind } from "./add-item-provider";

const KIND_OPTIONS = [
  { value: "task", label: copy.addItem.kinds.task },
  { value: "subtask", label: copy.addItem.kinds.subtask },
  { value: "module", label: copy.addItem.kinds.module },
] as const;

type AddItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: AddItemKind;
  onKindChange: (kind: AddItemKind) => void;
};

/** Header "Add item": adds a task, sub-task or module to the in-browser preview. */
export function AddItemDialog({ open, onOpenChange, kind, onKindChange }: AddItemDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={copy.addItem.title}
      description={copy.addItem.description}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {copy.dialog.cancel}
          </Button>
          <Button type="submit" form="add-item-form">
            {copy.addItem.submit}
          </Button>
        </>
      }
    >
      {open && (
        <AddItemForm kind={kind} onKindChange={onKindChange} onDone={() => onOpenChange(false)} />
      )}
    </ResponsiveDialog>
  );
}

function AddItemForm({
  kind,
  onKindChange,
  onDone,
}: {
  kind: AddItemKind;
  onKindChange: (kind: AddItemKind) => void;
  onDone: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Read once when the dialog opens; the form is remounted on every open.
  const [modules] = useState(() => getPreview().modules);
  const current = /^\/modules\/([^/]+)/.exec(pathname)?.[1];
  const [moduleId, setModuleId] = useState(
    modules.find((m) => m.id === (current && decodeURIComponent(current)))?.id ??
      modules[0]?.id ??
      "",
  );
  const tasks = modules.find((m) => m.id === moduleId)?.tasks ?? [];
  const [parentId, setParentId] = useState(tasks[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isModule = kind === "module";
  const isSub = kind === "subtask";

  const changeModule = (id: string) => {
    setModuleId(id);
    setParentId(modules.find((m) => m.id === id)?.tasks[0]?.id ?? "");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const name = title.trim();
    if (!name) return setError(copy.addItem.titleRequired);
    if (isSub && !parentId) return setError(copy.addItem.noTasks);

    let target = moduleId;
    if (isModule) {
      target = moduleSlug(
        name,
        getPreview().modules.map((m) => m.id),
      );
      setPreviewModules((ms) => [...ms, { id: target, name, icon: "folder", tasks: [] }]);
    } else {
      const n = node(name, "plain", { isCustom: true });
      setPreviewModules((ms) =>
        ms.map((m) =>
          m.id !== moduleId
            ? m
            : {
                ...m,
                tasks: isSub
                  ? updateNode(m.tasks, parentId, (p) => ({ ...p, children: [...p.children, n] }))
                  : [...m.tasks, n],
              },
        ),
      );
    }
    onDone();
    router.push(`/modules/${encodeURIComponent(target)}`);
  };

  return (
    <form id="add-item-form" className="flex flex-col gap-5" onSubmit={submit} noValidate>
      <SegmentedControl
        label={copy.addItem.kindLabel}
        options={KIND_OPTIONS}
        value={kind}
        onValueChange={(k) => {
          setError(null);
          onKindChange(k);
        }}
      />
      {!isModule && (
        <Field id="add-item-module" label={copy.addItem.moduleLabel}>
          <Select
            id="add-item-module"
            value={moduleId}
            onChange={(e) => changeModule(e.target.value)}
            className="h-12"
          >
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {isSub && (
        <Field
          id="add-item-parent"
          label={copy.addItem.parentLabel}
          hint={tasks.length ? undefined : copy.addItem.noTasks}
        >
          <Select
            id="add-item-parent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            disabled={!tasks.length}
            className="h-12"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field
        id="add-item-title"
        label={isModule ? copy.addItem.moduleNameLabel : copy.addItem.titleLabel}
        error={error ?? undefined}
      >
        <TextInput
          id="add-item-title"
          required
          autoFocus
          value={title}
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            setTitle(event.target.value);
            setError(null);
          }}
          placeholder={
            isModule ? copy.addItem.moduleNamePlaceholder : copy.addItem.titlePlaceholder
          }
        />
      </Field>
      <p className="text-label text-muted-foreground">{copy.addItem.previewNote}</p>
    </form>
  );
}

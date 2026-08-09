"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Plus,
  RotateCcw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useCms } from "../CmsProvider";
import type { Collection } from "../schema";
import { emptyItem, getPath, validateItem, type JsonObject } from "../validation";
import { ItemForm } from "./ItemForm";
import { PreviewCard } from "./PreviewCard";
import { AdminButton, Banner, Chip, Panel } from "./ui";

export function CollectionEditor({ collection }: { collection: Collection }) {
  const { files, updateDraft, revertDraft } = useCms();
  const state = files[collection.name];
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  if (!state) return null;

  const dirty = JSON.stringify(state.draft) !== JSON.stringify(state.baseline);

  const header = (
    <>
      <p>{collection.description}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {collection.usedOn.map((page) => (
          <Chip key={page}>{page}</Chip>
        ))}
        <Chip>{collection.file}</Chip>
      </div>
    </>
  );

  const revertButton = dirty ? (
    <AdminButton variant="ghost" onClick={() => revertDraft(collection.name)}>
      <RotateCcw aria-hidden="true" className="h-4 w-4" />
      Undo my changes
    </AdminButton>
  ) : null;

  if (collection.kind === "singleton") {
    const item = (state.draft ?? {}) as JsonObject;
    return (
      <div className="flex flex-col gap-4">
        {state.stale && <StaleNotice collection={collection} />}
        <Panel title={collection.label} description={header} actions={revertButton}>
          <ItemForm
            collection={collection}
            item={item}
            onChange={(next) => updateDraft(collection.name, next)}
          />
        </Panel>
      </div>
    );
  }

  const items = (Array.isArray(state.draft) ? state.draft : []) as JsonObject[];

  function replace(next: JsonObject[]) {
    updateDraft(collection.name, next);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    replace(next);
    setOpenIndex(target);
  }

  return (
    <div className="flex flex-col gap-4">
      {state.stale && <StaleNotice collection={collection} />}

      <Panel
        title={collection.label}
        description={header}
        actions={
          <>
            {revertButton}
            <AdminButton
              variant="primary"
              onClick={() => {
                replace([...items, emptyItem(collection)]);
                setOpenIndex(items.length);
              }}
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Add {collection.itemNoun ?? "entry"}
            </AdminButton>
          </>
        }
      >
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">
            Nothing here yet. The matching section is hidden on the site until you add one.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {items.map((item, index) => {
              const errors = validateItem(collection, item);
              const errorCount = Object.keys(errors).length;
              const labelField = collection.labelField ?? collection.identifierField;
              const rawLabel = labelField ? getPath(item, labelField) : undefined;
              const label =
                typeof rawLabel === "string" && rawLabel.trim() !== ""
                  ? rawLabel
                  : `Untitled ${collection.itemNoun ?? "entry"}`;
              const open = openIndex === index;

              return (
                <li key={index} className="rounded-sm border border-border">
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setOpenIndex(open ? null : index)}
                      aria-expanded={open}
                      className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-primary"
                    >
                      {open ? (
                        <ChevronUp aria-hidden="true" className="h-4 w-4 flex-none" />
                      ) : (
                        <ChevronDown aria-hidden="true" className="h-4 w-4 flex-none" />
                      )}
                      <span className="truncate">{label}</span>
                      {errorCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-sm bg-danger/10 px-1.5 py-0.5 text-xs font-semibold text-danger">
                          <TriangleAlert aria-hidden="true" className="h-3 w-3" />
                          {errorCount}
                        </span>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <IconButton
                        label={`Move ${label} up`}
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ChevronUp aria-hidden="true" className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label={`Move ${label} down`}
                        disabled={index === items.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ChevronDown aria-hidden="true" className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label={`Duplicate ${label}`}
                        onClick={() => {
                          const copy = { ...item };
                          if (collection.identifierField) {
                            const key = collection.identifierField;
                            const value = copy[key];
                            if (typeof value === "string") copy[key] = `${value}-copy`;
                          }
                          const next = [...items];
                          next.splice(index + 1, 0, copy);
                          replace(next);
                          setOpenIndex(index + 1);
                        }}
                      >
                        <Copy aria-hidden="true" className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label={`Delete ${label}`}
                        onClick={() => setConfirmDelete(index)}
                        tone="danger"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>

                  {confirmDelete === index && (
                    <div className="border-t border-border bg-danger/5 px-3 py-2 text-sm">
                      <span className="text-danger">Delete “{label}” from the site?</span>
                      <span className="ml-3 inline-flex gap-2">
                        <AdminButton
                          variant="danger"
                          onClick={() => {
                            replace(items.filter((_, position) => position !== index));
                            setConfirmDelete(null);
                            setOpenIndex(null);
                          }}
                        >
                          Yes, delete
                        </AdminButton>
                        <AdminButton variant="ghost" onClick={() => setConfirmDelete(null)}>
                          Keep it
                        </AdminButton>
                      </span>
                    </div>
                  )}

                  {open && (
                    <div className="border-t border-border px-4 py-4">
                      <ItemForm
                        collection={collection}
                        item={item}
                        onChange={(next) => {
                          const updated = [...items];
                          updated[index] = next;
                          replace(updated);
                        }}
                      />
                      {collection.preview && (
                        <div className="mt-5 border-t border-border pt-4">
                          <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                            <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                            How it looks on the site
                          </p>
                          <div className="max-w-md">
                            <PreviewCard collection={collection} item={item} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    </div>
  );
}

function StaleNotice({ collection }: { collection: Collection }) {
  const { revertDraft } = useCms();
  return (
    <Banner
      tone="warning"
      title="Someone else published a change to this page"
      actions={
        <AdminButton variant="secondary" onClick={() => revertDraft(collection.name)}>
          Discard my version
        </AdminButton>
      }
    >
      Your unpublished edits are still here, but they were started from an older version. Check that
      you are not about to undo someone else&apos;s work before publishing.
    </Banner>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-sm border border-transparent p-1.5 transition-colors hover:border-border disabled:cursor-not-allowed disabled:opacity-30 ${
        tone === "danger" ? "text-danger" : "text-text-muted hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

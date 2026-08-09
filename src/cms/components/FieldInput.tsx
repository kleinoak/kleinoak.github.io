"use client";

import { useId, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import type { Field } from "../schema";
import type { JsonObject } from "../validation";
import { useCms } from "../CmsProvider";
import { dataUrlFor, formatBytes, prepareImage } from "../image";
import { imageSizeWarning } from "../config";
import { AdminButton } from "./ui";

const inputClass =
  "w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted/60 focus:border-accent-strong focus:outline-none";

export function FieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: Field;
  value: unknown;
  onChange: (next: unknown) => void;
  error?: string;
}) {
  const id = useId();
  const describedBy = [field.help ? `${id}-help` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-primary">
        {field.label}
        {field.required && <span className="ml-1 text-danger">*</span>}
      </label>

      <Control
        id={id}
        field={field}
        value={value}
        onChange={onChange}
        invalid={Boolean(error)}
        describedBy={describedBy || undefined}
      />

      {field.help && (
        <p id={`${id}-help`} className="text-xs text-text-muted">
          {field.help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function Control({
  id,
  field,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  id: string;
  field: Field;
  value: unknown;
  onChange: (next: unknown) => void;
  invalid: boolean;
  describedBy?: string;
}) {
  const border = invalid ? "border-danger" : "";

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          id={id}
          rows={field.rows ?? 3}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} ${border} resize-y`}
        />
      );

    case "boolean":
      return (
        <label className="inline-flex items-center gap-2 text-sm text-text">
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent-strong)]"
          />
          {value === true ? "Yes" : "No"}
        </label>
      );

    case "select":
      return (
        <select
          id={id}
          value={typeof value === "string" ? value : ""}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} ${border}`}
        >
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case "number":
      return (
        <input
          id={id}
          type="number"
          value={typeof value === "number" ? value : ""}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))}
          className={`${inputClass} ${border}`}
        />
      );

    case "stringList":
      return (
        <textarea
          id={id}
          rows={Math.max(3, Array.isArray(value) ? value.length + 1 : 3)}
          value={Array.isArray(value) ? value.join("\n") : ""}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value.split("\n"))}
          placeholder={field.itemNoun ? `One ${field.itemNoun} per line` : "One per line"}
          className={`${inputClass} ${border} resize-y font-mono text-[13px]`}
        />
      );

    case "image":
      return <ImageControl field={field} value={value} onChange={onChange} />;

    default:
      return (
        <input
          id={id}
          type={field.type === "email" ? "email" : "text"}
          inputMode={field.type === "url" || field.type === "link" ? "url" : undefined}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} ${border}`}
        />
      );
  }
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function ImageControl({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const { media, addMedia, mediaPersisted } = useCms();
  const [working, setWorking] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const photo = (value ?? {}) as JsonObject;
  const src = typeof photo.src === "string" ? photo.src : "";
  const pendingBase64 = media[`public${src}`];
  const preview = pendingBase64 ? dataUrlFor(src, pendingBase64) : src ? `${basePath}${src}` : "";

  async function handleFile(file: File) {
    setWorking(true);
    setUploadError(null);
    try {
      const prepared = await prepareImage(file);
      addMedia(prepared.path, prepared.base64);
      onChange({
        src: prepared.src,
        alt: typeof photo.alt === "string" ? photo.alt : "",
        width: prepared.width,
        height: prepared.height,
      });
      if (prepared.bytes > imageSizeWarning) {
        setUploadError(
          `That photo is still ${formatBytes(prepared.bytes)} after resizing. It will work, but a smaller photo keeps the site fast.`,
        );
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Could not read that image.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {preview ? (
        <figure className="flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="max-h-56 w-full rounded-sm border border-border object-contain"
          />
          <figcaption className="text-xs text-text-muted">
            {src}
            {pendingBase64 && " — not published yet"}
          </figcaption>
        </figure>
      ) : (
        <p className="rounded-sm border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
          No photo yet.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-border px-3 py-2 text-sm font-semibold text-primary hover:border-accent-strong">
          {working ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus aria-hidden="true" className="h-4 w-4" />
          )}
          {src ? "Replace photo" : "Choose photo"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
        </label>
        {src && (
          <AdminButton variant="danger" onClick={() => onChange(undefined)}>
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            Remove photo
          </AdminButton>
        )}
      </div>

      {src && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-primary">
            Photo description (alt text)<span className="ml-1 text-danger">*</span>
          </span>
          <input
            type="text"
            value={typeof photo.alt === "string" ? photo.alt : ""}
            onChange={(event) => onChange({ ...photo, alt: event.target.value })}
            placeholder="The Klein Oak Junior Varsity team in the school gym"
            className={inputClass}
          />
          <span className="text-xs text-text-muted">
            Describe what the photo shows — screen readers read this aloud, and it appears if the
            photo fails to load.
          </span>
        </label>
      )}

      {!mediaPersisted && (
        <p className="text-xs font-medium text-warning">
          This photo is held in this browser tab only — publish before closing the tab.
        </p>
      )}
      {uploadError && <p className="text-xs font-medium text-warning">{uploadError}</p>}
      {field.help && <span className="sr-only">{field.help}</span>}
    </div>
  );
}

/**
 * Shared content rules. Used by the admin forms (live, per field) and by
 * `scripts/validate-content.ts` (before every build and on every pull request),
 * so a bad edit is caught in the editor first and can never reach the site.
 *
 * Imported by Node directly — keep it dependency-free.
 */
import type { Collection, Field } from "./schema";

export type Issue = {
  /** Index in the list, when the collection is a list. */
  index?: number;
  /** Field name the issue belongs to, when it is field-specific. */
  field?: string;
  message: string;
};

export type JsonObject = Record<string, unknown>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\u0027\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function getPath(source: unknown, path: string): unknown {
  let current: unknown = source;
  for (const part of path.split(".")) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as JsonObject)[part];
  }
  return current;
}

/** Returns a copy of `source` with `path` set to `value`. */
export function setPath(source: JsonObject, path: string, value: unknown): JsonObject {
  const [head, ...rest] = path.split(".");
  const next: JsonObject = { ...source };
  if (rest.length === 0) {
    next[head] = value;
    return next;
  }
  const child = next[head];
  next[head] = setPath(
    child && typeof child === "object" && !Array.isArray(child) ? (child as JsonObject) : {},
    rest.join("."),
    value,
  );
  return next;
}

function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as JsonObject).length === 0;
  return false;
}

export function emptyValueFor(field: Field): unknown {
  switch (field.type) {
    case "boolean":
      return false;
    case "stringList":
      return [];
    case "number":
      return 0;
    case "select":
      return field.options?.[0]?.value ?? "";
    case "image":
      return undefined;
    default:
      return "";
  }
}

export function emptyItem(collection: Collection): JsonObject {
  let item: JsonObject = {};
  for (const field of collection.fields) {
    const value = emptyValueFor(field);
    if (value !== undefined) item = setPath(item, field.name, value);
  }
  return item;
}

function validateField(field: Field, value: unknown): string | null {
  if (isBlank(value)) {
    return field.required ? `${field.label} is required.` : null;
  }

  switch (field.type) {
    case "text":
    case "textarea": {
      if (typeof value !== "string") return `${field.label} must be text.`;
      if (field.maxLength && value.trim().length > field.maxLength) {
        return `${field.label} is ${value.trim().length} characters — keep it under ${field.maxLength}.`;
      }
      return null;
    }
    case "slug": {
      if (typeof value !== "string") return `${field.label} must be text.`;
      if (!slugPattern.test(value)) {
        return `${field.label} may only use lowercase letters, numbers and single dashes (for example "meet-the-panthers").`;
      }
      return null;
    }
    case "url": {
      if (typeof value !== "string" || !/^https?:\/\/\S+$/.test(value.trim())) {
        return `${field.label} must be a full web address starting with https://`;
      }
      return null;
    }
    case "email": {
      if (typeof value !== "string" || !emailPattern.test(value.trim())) {
        return `${field.label} must be an email address.`;
      }
      return null;
    }
    case "link": {
      if (typeof value !== "string") return `${field.label} must be text.`;
      const trimmed = value.trim();
      const ok =
        /^https?:\/\/\S+$/.test(trimmed) ||
        /^mailto:[^\s@]+@[^\s@]+\.\S+$/.test(trimmed) ||
        /^tel:\+?[\d\-().\s]+$/.test(trimmed) ||
        /^\/[\w\-/#?=&.]*$/.test(trimmed);
      return ok
        ? null
        : `${field.label} must be a page on this site (starting with /), a full https:// address, or a mailto: address.`;
    }
    case "select": {
      const allowed = (field.options ?? []).map((option) => option.value);
      if (typeof value !== "string" || !allowed.includes(value)) {
        return `${field.label} must be one of: ${allowed.join(", ")}.`;
      }
      return null;
    }
    case "boolean": {
      return typeof value === "boolean" ? null : `${field.label} must be true or false.`;
    }
    case "number": {
      return typeof value === "number" && Number.isFinite(value)
        ? null
        : `${field.label} must be a number.`;
    }
    case "stringList": {
      if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
        return `${field.label} must be a list of text entries.`;
      }
      if (value.some((entry) => (entry as string).trim() === "")) {
        return `${field.label} has an empty entry — remove it or fill it in.`;
      }
      return null;
    }
    case "image": {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return `${field.label} is malformed.`;
      }
      const photo = value as JsonObject;
      if (typeof photo.src !== "string" || photo.src.trim() === "") {
        return `${field.label} is missing its file.`;
      }
      if (typeof photo.alt !== "string" || photo.alt.trim() === "") {
        return `${field.label} needs alt text describing the photo (required for screen readers).`;
      }
      if (typeof photo.width !== "number" || typeof photo.height !== "number") {
        return `${field.label} is missing its dimensions — re-upload the photo.`;
      }
      return null;
    }
    default:
      return null;
  }
}

/** Field-level errors for a single item, keyed by field name. */
export function validateItem(collection: Collection, item: JsonObject): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of collection.fields) {
    const message = validateField(field, getPath(item, field.name));
    if (message) errors[field.name] = message;
  }
  return errors;
}

/** Every issue in a whole collection file, including duplicate identifiers. */
export function validateCollectionData(collection: Collection, data: unknown): Issue[] {
  const issues: Issue[] = [];

  if (collection.kind === "singleton") {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return [{ message: `${collection.file} must contain a single JSON object.` }];
    }
    const errors = validateItem(collection, data as JsonObject);
    for (const [field, message] of Object.entries(errors)) {
      issues.push({ field, message });
    }
    return issues;
  }

  if (!Array.isArray(data)) {
    return [{ message: `${collection.file} must contain a JSON list.` }];
  }

  const seen = new Map<string, number>();
  data.forEach((rawItem, index) => {
    if (typeof rawItem !== "object" || rawItem === null || Array.isArray(rawItem)) {
      issues.push({ index, message: `Entry ${index + 1} is not a JSON object.` });
      return;
    }
    const item = rawItem as JsonObject;
    const errors = validateItem(collection, item);
    for (const [field, message] of Object.entries(errors)) {
      issues.push({ index, field, message });
    }

    if (collection.identifierField) {
      const key = getPath(item, collection.identifierField);
      if (typeof key === "string" && key.trim() !== "") {
        const first = seen.get(key);
        if (first !== undefined) {
          issues.push({
            index,
            field: collection.identifierField,
            message: `"${key}" is already used by entry ${first + 1} — each one must be unique.`,
          });
        } else {
          seen.set(key, index);
        }
      }
    }
  });

  return issues;
}

/**
 * Trims strings and drops empty optional values so the committed JSON stays
 * clean (no `"time": ""` keys) and diffs stay readable.
 */
export function normalize(collection: Collection, data: unknown): unknown {
  if (collection.kind === "singleton") {
    return normalizeItem(collection, data as JsonObject);
  }
  if (!Array.isArray(data)) return data;
  return data.map((item) => normalizeItem(collection, item as JsonObject));
}

function normalizeItem(collection: Collection, item: JsonObject): JsonObject {
  let next: JsonObject = {};
  for (const field of collection.fields) {
    let value = getPath(item, field.name);

    if (typeof value === "string") value = value.trim();
    if (Array.isArray(value)) {
      value = value
        .map((entry) => (typeof entry === "string" ? entry.trim() : entry))
        .filter((entry) => !(typeof entry === "string" && entry === ""));
    }
    if (field.type === "image" && value && typeof value === "object") {
      const photo = value as JsonObject;
      value = isBlank(photo.src)
        ? undefined
        : {
            src: String(photo.src).trim(),
            alt: typeof photo.alt === "string" ? photo.alt.trim() : "",
            width: photo.width,
            height: photo.height,
          };
    }

    const keep = field.required || field.type === "boolean" || !isBlank(value);
    if (keep && value !== undefined) next = setPath(next, field.name, value);
  }
  return next;
}

export function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

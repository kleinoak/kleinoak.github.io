/**
 * Turns "old JSON vs new JSON" into something a volunteer can actually check
 * before publishing: which entries were added, removed, reordered, and exactly
 * which fields changed from what to what.
 */
import type { Collection, Field } from "./schema";
import { getPath, type JsonObject } from "./validation";

export type FieldChange = {
  field: string;
  label: string;
  from: string;
  to: string;
};

export type ItemChange = {
  label: string;
  fields: FieldChange[];
};

export type ChangeSummary = {
  collection: Collection;
  added: string[];
  removed: string[];
  changed: ItemChange[];
  reordered: boolean;
  /** True when nothing actually differs. */
  empty: boolean;
};

const blank = "(blank)";

export function formatValue(field: Field | undefined, value: unknown): string {
  if (value === undefined || value === null || value === "") return blank;
  if (typeof value === "boolean") return value ? "on" : "off";
  if (Array.isArray(value)) return value.length ? value.join(", ") : blank;
  if (typeof value === "object") {
    const photo = value as JsonObject;
    return typeof photo.src === "string" ? photo.src : JSON.stringify(value);
  }
  if (field?.type === "select") {
    const option = field.options?.find((entry) => entry.value === value);
    if (option) return option.label;
  }
  return String(value);
}

function itemLabel(collection: Collection, item: JsonObject, index: number): string {
  for (const field of [collection.labelField, collection.identifierField]) {
    const value = field ? getPath(item, field) : undefined;
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return `Entry ${index + 1}`;
}

function diffFields(collection: Collection, before: JsonObject, after: JsonObject): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of collection.fields) {
    const from = getPath(before, field.name);
    const to = getPath(after, field.name);
    if (JSON.stringify(from ?? null) === JSON.stringify(to ?? null)) continue;
    changes.push({
      field: field.name,
      label: field.label,
      from: formatValue(field, from),
      to: formatValue(field, to),
    });
  }
  return changes;
}

export function summarizeChanges(
  collection: Collection,
  before: unknown,
  after: unknown,
): ChangeSummary {
  const summary: ChangeSummary = {
    collection,
    added: [],
    removed: [],
    changed: [],
    reordered: false,
    empty: JSON.stringify(before) === JSON.stringify(after),
  };

  if (summary.empty) return summary;

  if (collection.kind === "singleton") {
    const fields = diffFields(collection, (before ?? {}) as JsonObject, (after ?? {}) as JsonObject);
    if (fields.length) summary.changed.push({ label: collection.label, fields });
    return summary;
  }

  const beforeList = Array.isArray(before) ? (before as JsonObject[]) : [];
  const afterList = Array.isArray(after) ? (after as JsonObject[]) : [];
  const key = collection.identifierField;

  if (!key) {
    // No stable identifier — compare position by position.
    const length = Math.max(beforeList.length, afterList.length);
    for (let index = 0; index < length; index += 1) {
      const from = beforeList[index];
      const to = afterList[index];
      if (from && !to) summary.removed.push(itemLabel(collection, from, index));
      else if (!from && to) summary.added.push(itemLabel(collection, to, index));
      else if (from && to) {
        const fields = diffFields(collection, from, to);
        if (fields.length) summary.changed.push({ label: itemLabel(collection, to, index), fields });
      }
    }
    return summary;
  }

  const beforeByKey = new Map(beforeList.map((item) => [String(getPath(item, key)), item]));
  const afterByKey = new Map(afterList.map((item) => [String(getPath(item, key)), item]));

  afterList.forEach((item, index) => {
    const id = String(getPath(item, key));
    const previous = beforeByKey.get(id);
    if (!previous) {
      summary.added.push(itemLabel(collection, item, index));
      return;
    }
    const fields = diffFields(collection, previous, item);
    if (fields.length) summary.changed.push({ label: itemLabel(collection, item, index), fields });
  });

  beforeList.forEach((item, index) => {
    const id = String(getPath(item, key));
    if (!afterByKey.has(id)) summary.removed.push(itemLabel(collection, item, index));
  });

  const commonBefore = beforeList
    .map((item) => String(getPath(item, key)))
    .filter((id) => afterByKey.has(id));
  const commonAfter = afterList
    .map((item) => String(getPath(item, key)))
    .filter((id) => beforeByKey.has(id));
  summary.reordered = commonBefore.join("|") !== commonAfter.join("|");

  return summary;
}

/** A one-line description used as the default commit message. */
export function describeChanges(summaries: ChangeSummary[]): string {
  const parts: string[] = [];
  for (const summary of summaries) {
    if (summary.empty) continue;
    const bits: string[] = [];
    if (summary.added.length) bits.push(`+${summary.added.length}`);
    if (summary.removed.length) bits.push(`−${summary.removed.length}`);
    if (summary.changed.length) bits.push(`~${summary.changed.length}`);
    if (!bits.length && summary.reordered) bits.push("reordered");
    parts.push(`${summary.collection.label} (${bits.join(" ")})`);
  }
  return parts.length ? `Update ${parts.join(", ")}` : "Update site content";
}

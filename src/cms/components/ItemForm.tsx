"use client";

import type { Collection } from "../schema";
import { getPath, setPath, slugify, validateItem, type JsonObject } from "../validation";
import { FieldInput } from "./FieldInput";

/**
 * The form for one entry. Slug fields fill themselves in from the title while
 * they are still untouched, so volunteers never have to think about IDs.
 */
export function ItemForm({
  collection,
  item,
  onChange,
}: {
  collection: Collection;
  item: JsonObject;
  onChange: (next: JsonObject) => void;
}) {
  const errors = validateItem(collection, item);

  function update(fieldName: string, value: unknown) {
    let next = setPath(item, fieldName, value);

    for (const candidate of collection.fields) {
      if (candidate.type !== "slug" || candidate.deriveFrom !== fieldName) continue;
      const current = getPath(item, candidate.name);
      const derivedFromOld = slugify(String(getPath(item, fieldName) ?? ""));
      const untouched = !current || current === derivedFromOld;
      if (untouched && typeof value === "string") {
        next = setPath(next, candidate.name, slugify(value));
      }
    }

    onChange(next);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {collection.fields.map((field) => (
        <div
          key={field.name}
          className={
            field.type === "textarea" || field.type === "image" || field.type === "stringList"
              ? "sm:col-span-2"
              : undefined
          }
        >
          <FieldInput
            field={field}
            value={getPath(item, field.name)}
            error={errors[field.name]}
            onChange={(value) => update(field.name, value)}
          />
        </div>
      ))}
    </div>
  );
}

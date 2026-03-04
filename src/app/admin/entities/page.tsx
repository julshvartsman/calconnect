"use client";

import { useState } from "react";

type EntityType = "category" | "tag" | "provider";

export default function AdminEntitiesPage() {
  const [entityType, setEntityType] = useState<EntityType>("category");
  const [message, setMessage] = useState<string>("");

  async function createEntity(formData: FormData) {
    setMessage("");
    const payload = {
      entityType,
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? "") || undefined,
      type: String(formData.get("type") ?? "") || undefined,
      contactEmail: String(formData.get("contactEmail") ?? "") || undefined,
      campusOrgType:
        String(formData.get("campusOrgType") ?? "") || undefined,
    };

    const response = await fetch("/api/admin/entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setMessage("Created successfully.");
    } else {
      setMessage("Failed to create entity.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Admin · Categories / Tags / Providers</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Create related entities used by resource cards and recommendations.
      </p>

      <form action={createEntity} className="mt-6 space-y-3 rounded-xl border p-4">
        <label className="flex flex-col gap-1 text-sm">
          Entity type
          <select
            value={entityType}
            onChange={(event) => setEntityType(event.target.value as EntityType)}
            className="rounded border px-3 py-2"
          >
            <option value="category">Category</option>
            <option value="tag">Tag</option>
            <option value="provider">Provider</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Name
          <input name="name" required className="rounded border px-3 py-2" />
        </label>

        {entityType === "category" && (
          <label className="flex flex-col gap-1 text-sm">
            Slug (optional)
            <input name="slug" className="rounded border px-3 py-2" />
          </label>
        )}

        {entityType === "tag" && (
          <label className="flex flex-col gap-1 text-sm">
            Type (e.g., identity, status, topic)
            <input name="type" className="rounded border px-3 py-2" />
          </label>
        )}

        {entityType === "provider" && (
          <>
            <label className="flex flex-col gap-1 text-sm">
              Contact email
              <input name="contactEmail" className="rounded border px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Org type
              <select name="campusOrgType" className="rounded border px-3 py-2">
                <option value="office">Office</option>
                <option value="student_org">Student organization</option>
                <option value="external_partner">External partner</option>
              </select>
            </label>
          </>
        )}

        <button
          type="submit"
          className="rounded bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
        >
          Create
        </button>
        {message && <p className="text-sm text-zinc-700">{message}</p>}
      </form>
    </main>
  );
}

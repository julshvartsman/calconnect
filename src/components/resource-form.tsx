"use client";

import { useMemo, useState } from "react";

type Option = { id: string; name: string };
type ProviderOption = { id: string; name: string };

type ResourceFormProps = {
  mode: "create" | "edit";
  resourceId?: string;
  defaults?: {
    name?: string;
    shortDescription?: string;
    fullDescription?: string | null;
    eligibilityText?: string;
    isAppointmentRequired?: boolean;
    walkInAllowed?: boolean;
    whatToBring?: string[];
    requirementsLink?: string | null;
    websiteUrl?: string | null;
    officialUrl?: string | null;
    hoursJson?: string;
    categoryId?: string;
    providerId?: string | null;
    tagIds?: string[];
    location?: {
      address?: string;
      buildingName?: string | null;
      room?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      notes?: string | null;
    } | null;
    isActive?: boolean;
  };
  categories: Option[];
  tags: Option[];
  providers: ProviderOption[];
};

export function ResourceForm({
  mode,
  resourceId,
  defaults,
  categories,
  tags,
  providers,
}: ResourceFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const defaultHours = useMemo(
    () =>
      defaults?.hoursJson ??
      JSON.stringify(
        {
          type: "scheduled",
          slots: [
            { days: "Monday, Tuesday, Wednesday, Thursday, Friday", open: "9:00 AM", close: "5:00 PM" },
          ],
        },
        null,
        2,
      ),
    [defaults?.hoursJson],
  );

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setSuccess(null);

    try {
      const latitudeRaw = String(formData.get("latitude") ?? "").trim();
      const longitudeRaw = String(formData.get("longitude") ?? "").trim();
      const latitude = latitudeRaw.length ? Number(latitudeRaw) : null;
      const longitude = longitudeRaw.length ? Number(longitudeRaw) : null;
      const location = {
        address: String(formData.get("address") ?? ""),
        buildingName: String(formData.get("buildingName") ?? "") || null,
        room: String(formData.get("room") ?? "") || null,
        latitude: Number.isNaN(latitude) ? null : latitude,
        longitude: Number.isNaN(longitude) ? null : longitude,
        notes: String(formData.get("locationNotes") ?? "") || null,
      };

      const hoursRaw = String(formData.get("hoursJson") ?? "{}");
      let hoursJson: unknown;
      try {
        hoursJson = JSON.parse(hoursRaw);
      } catch {
        setError("Hours JSON is invalid. Please check the syntax and try again.");
        setPending(false);
        return;
      }

      const payload = {
        name: String(formData.get("name") ?? ""),
        shortDescription: String(formData.get("shortDescription") ?? ""),
        fullDescription: String(formData.get("fullDescription") ?? "") || null,
        eligibilityText: String(formData.get("eligibilityText") ?? ""),
        isAppointmentRequired: formData.get("isAppointmentRequired") === "on",
        walkInAllowed: formData.get("walkInAllowed") === "on",
        whatToBring: String(formData.get("whatToBring") ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        requirementsLink: String(formData.get("requirementsLink") ?? "") || null,
        websiteUrl: String(formData.get("websiteUrl") ?? "") || null,
        officialUrl: String(formData.get("officialUrl") ?? "") || null,
        hoursJson,
        categoryId: String(formData.get("categoryId") ?? ""),
        providerId: String(formData.get("providerId") ?? "") || null,
        tagIds: formData.getAll("tagIds").map(String),
        location: location.address ? location : null,
        isActive: formData.get("isActive") === "on",
      };

      const endpoint =
        mode === "create" ? "/api/resources" : `/api/resources/${resourceId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to save resource.");
      }

      setSuccess("Saved successfully.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit form.",
      );
    } finally {
      setPending(false);
    }
  }

  async function summarizeNow() {
    if (!resourceId) return;
    setPending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/resources/${resourceId}/summarize`, {
        method: "POST",
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to summarize resource.");
      }
      setSuccess("Scrape + summarize finished.");
    } catch (summarizeError) {
      setError(
        summarizeError instanceof Error
          ? summarizeError.message
          : "Summarize request failed.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-6 rounded-xl border p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            name="name"
            defaultValue={defaults?.name ?? ""}
            required
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Category
          <select
            name="categoryId"
            defaultValue={defaults?.categoryId ?? categories[0]?.id}
            className="rounded border px-3 py-2"
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Short description
        <textarea
          name="shortDescription"
          required
          defaultValue={defaults?.shortDescription ?? ""}
          className="min-h-20 rounded border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Full description
        <textarea
          name="fullDescription"
          defaultValue={defaults?.fullDescription ?? ""}
          className="min-h-28 rounded border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Eligibility text
        <textarea
          name="eligibilityText"
          required
          defaultValue={defaults?.eligibilityText ?? ""}
          className="min-h-20 rounded border px-3 py-2"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Requirements link
          <input
            name="requirementsLink"
            defaultValue={defaults?.requirementsLink ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Website URL
          <input
            name="websiteUrl"
            defaultValue={defaults?.websiteUrl ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Official URL (for scraping)
          <input
            name="officialUrl"
            defaultValue={defaults?.officialUrl ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        What to bring (comma-separated)
        <input
          name="whatToBring"
          defaultValue={(defaults?.whatToBring ?? []).join(", ")}
          className="rounded border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Hours JSON
        <textarea
          name="hoursJson"
          defaultValue={defaultHours}
          className="min-h-40 rounded border px-3 py-2 font-mono text-xs"
        />
      </label>

      <fieldset className="grid gap-2 rounded border p-3">
        <legend className="px-1 text-sm font-medium">Tags</legend>
        <div className="grid gap-2 md:grid-cols-3">
          {tags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="tagIds"
                value={tag.id}
                defaultChecked={defaults?.tagIds?.includes(tag.id)}
              />
              {tag.name}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        Provider
        <select
          name="providerId"
          defaultValue={defaults?.providerId ?? ""}
          className="rounded border px-3 py-2"
        >
          <option value="">None</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="grid gap-4 rounded border p-4 md:grid-cols-2">
        <legend className="px-1 text-sm font-medium">Location</legend>
        <label className="flex flex-col gap-1 text-sm">
          Address
          <input
            name="address"
            defaultValue={defaults?.location?.address ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Building
          <input
            name="buildingName"
            defaultValue={defaults?.location?.buildingName ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Room
          <input
            name="room"
            defaultValue={defaults?.location?.room ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Notes
          <input
            name="locationNotes"
            defaultValue={defaults?.location?.notes ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Latitude
          <input
            name="latitude"
            type="number"
            step="0.000001"
            defaultValue={defaults?.location?.latitude ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Longitude
          <input
            name="longitude"
            type="number"
            step="0.000001"
            defaultValue={defaults?.location?.longitude ?? ""}
            className="rounded border px-3 py-2"
          />
        </label>
      </fieldset>

      <div className="grid gap-2 md:grid-cols-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            name="walkInAllowed"
            type="checkbox"
            defaultChecked={defaults?.walkInAllowed ?? true}
          />
          Walk-in allowed
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="isAppointmentRequired"
            type="checkbox"
            defaultChecked={defaults?.isAppointmentRequired ?? false}
          />
          Appointment required
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={defaults?.isActive ?? true}
          />
          Active
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? "Saving..." : mode === "create" ? "Create resource" : "Save"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            disabled={pending}
            onClick={summarizeNow}
            className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
          >
            Fetch & summarize
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}
    </form>
  );
}

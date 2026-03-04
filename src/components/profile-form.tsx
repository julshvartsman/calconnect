"use client";

import { useState } from "react";

type ProfileFormProps = {
  defaults?: {
    studentType?: string;
    year?: string;
    identities?: string[];
    financialSituation?: string;
    topics?: string[];
  };
};

export function ProfileForm({ defaults }: ProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveProfile(formData: FormData) {
    setSaving(true);
    setMessage(null);

    const payload = {
      studentType: String(formData.get("studentType") ?? "") || null,
      year: String(formData.get("year") ?? "") || null,
      identities: String(formData.get("identities") ?? "")
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean),
      financialSituation:
        String(formData.get("financialSituation") ?? "") || null,
      topics: String(formData.get("topics") ?? "")
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean),
    };

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setMessage("Could not save profile right now.");
      setSaving(false);
      return;
    }

    setMessage("Profile saved.");
    setSaving(false);
  }

  return (
    <form action={saveProfile} className="card-surface space-y-3 rounded-2xl p-5">
      <h3 className="text-berkeley text-sm font-semibold">
        Optional personalization profile
      </h3>
      <p className="text-xs text-slate-600">
        This helps CalConnect suggest resources you might miss.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Student type
          <input
            name="studentType"
            defaultValue={defaults?.studentType ?? ""}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Year
          <input
            name="year"
            defaultValue={defaults?.year ?? ""}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Identities (comma-separated)
        <input
          name="identities"
          defaultValue={(defaults?.identities ?? []).join(", ")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Financial situation
        <input
          name="financialSituation"
          defaultValue={defaults?.financialSituation ?? ""}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Topics you care about (comma-separated)
        <input
          name="topics"
          defaultValue={(defaults?.topics ?? []).join(", ")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-[var(--berkeley-blue)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--berkeley-blue-700)] disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
      {message && <p className="text-sm text-slate-700">{message}</p>}
    </form>
  );
}

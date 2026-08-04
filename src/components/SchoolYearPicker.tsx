"use client";

import { useRouter } from "next/navigation";

export type PickerSchool = {
  id: string;
  name: string;
  years: {
    fiscalYear: number;
    basis: "actual" | "target";
    // Wider pot than the endowment proper, derived from the row citation.
    poolUniverse?: boolean;
  }[]; // descending
  disabledReason?: string; // e.g. Stanford — no disclosed mixes
};

// School + fiscal-year picker for the Translator. Only years with a disclosed
// allocation are offered (task 4.2); a school with none appears, disabled,
// with the plain-English reason — an honest absence, not a silent one.
export function SchoolYearPicker({
  schools,
  school,
  year,
  missingYearsNote,
}: {
  schools: PickerSchool[];
  school?: string;
  year?: number;
  missingYearsNote?: string;
}) {
  const router = useRouter();
  const current = schools.find((s) => s.id === school);

  function go(nextSchool: string, nextYear?: number) {
    const target = schools.find((s) => s.id === nextSchool);
    if (!target || target.years.length === 0) return;
    const fy =
      nextYear !== undefined && target.years.some((y) => y.fiscalYear === nextYear)
        ? nextYear
        : target.years[0].fiscalYear;
    router.push(`/translate?school=${nextSchool}&year=${fy}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">School</span>
        <select
          value={school ?? ""}
          onChange={(e) => go(e.target.value)}
          className="w-full max-w-[19rem] rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            Pick a school…
          </option>
          {schools.map((s) => (
            <option key={s.id} value={s.id} disabled={s.years.length === 0}>
              {s.name}
              {s.years.length === 0 && s.disabledReason ? ` — ${s.disabledReason}` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Fiscal year of the mix</span>
        <select
          value={year ?? ""}
          onChange={(e) => current && go(current.id, Number(e.target.value))}
          disabled={!current || current.years.length === 0}
          className="w-full max-w-[19rem] rounded border border-zinc-300 bg-white px-3 py-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            {current ? "Pick a year…" : "Pick a school first"}
          </option>
          {current?.years.map((y) => (
            <option key={y.fiscalYear} value={y.fiscalYear}>
              FY{y.fiscalYear}
              {y.basis === "target" ? " (published target)" : ""}
              {y.poolUniverse ? " (investment pool)" : ""}
            </option>
          ))}
        </select>
      </label>
      {missingYearsNote && (
        <p className="max-w-md text-xs text-zinc-500 dark:text-zinc-400">{missingYearsNote}</p>
      )}
    </div>
  );
}

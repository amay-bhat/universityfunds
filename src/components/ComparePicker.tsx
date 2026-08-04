"use client";

import { useRouter } from "next/navigation";

export type CompareSchoolOption = {
  id: string;
  name: string;
  fromMin: number; // earliest usable "from" fiscal year
  note?: string; // e.g. Stanford's benchmarks-only caveat
};

// School + period picker for the Compare page. The from/to bounds derive from
// each school's real coverage, so impossible periods can't be selected
// (invalid deep links are clamped server-side with a notice).
export function ComparePicker({
  schools,
  school,
  from,
  to,
  maxYear,
}: {
  schools: CompareSchoolOption[];
  school: string;
  from: number;
  to: number;
  maxYear: number;
}) {
  const router = useRouter();
  const current = schools.find((s) => s.id === school) ?? schools[0];

  function push(nextSchool: string, nextFrom: number, nextTo: number) {
    const target = schools.find((s) => s.id === nextSchool) ?? schools[0];
    const f = Math.min(Math.max(nextFrom, target.fromMin), maxYear - 1);
    const t = Math.min(Math.max(nextTo, f + 1), maxYear);
    router.push(`/compare?school=${target.id}&from=${f}&to=${t}`);
  }

  const fromYears: number[] = [];
  for (let y = current.fromMin; y < maxYear; y++) fromYears.push(y);
  const toYears: number[] = [];
  for (let y = from + 1; y <= maxYear; y++) toYears.push(y);

  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">School</span>
        <select
          value={current.id}
          onChange={(e) => push(e.target.value, from, to)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">From (start of FY)</span>
        <select
          value={from}
          onChange={(e) => push(current.id, Number(e.target.value), to)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {fromYears.map((y) => (
            <option key={y} value={y}>
              FY{y}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">To (end of FY)</span>
        <select
          value={to}
          onChange={(e) => push(current.id, from, Number(e.target.value))}
          className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {toYears.map((y) => (
            <option key={y} value={y}>
              FY{y}
            </option>
          ))}
        </select>
      </label>
      {current.note && (
        <p className="max-w-md text-xs text-zinc-500 dark:text-zinc-400">{current.note}</p>
      )}
    </div>
  );
}

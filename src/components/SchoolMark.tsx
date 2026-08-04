import type { SchoolId } from "@/lib/constants";
import { SCHOOL_THEME } from "@/lib/school-theme";

// Monogram badge in the school's official color. Decorative identity — the
// school NAME always appears beside it, so meaning never rides on color alone.
export function SchoolMark({
  school,
  size = "md",
}: {
  school: SchoolId;
  size?: "sm" | "md" | "lg";
}) {
  const t = SCHOOL_THEME[school];
  const cls =
    size === "lg"
      ? "h-12 w-12 rounded-xl text-xl"
      : size === "sm"
        ? "h-7 w-7 rounded-md text-sm"
        : "h-9 w-9 rounded-lg text-base";
  return (
    <span
      aria-hidden="true"
      className={`${cls} inline-flex shrink-0 select-none items-center justify-center font-bold`}
      style={{ backgroundColor: t.color, color: t.fg }}
    >
      {t.monogram}
    </span>
  );
}

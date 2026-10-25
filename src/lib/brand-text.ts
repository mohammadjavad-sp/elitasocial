/** Upgrade only the former Persian spelling; account handles and Latin URLs stay intact. */
export function normalizeBrandSpelling(value: string): string {
  return value.replace(/الیتا[\s\u200c\u200d]*سوشال/gu, "الیتا سوشیال");
}

/** Content and settings contain JSON values; return a copy without mutating saved data. */
export function normalizeBrandText<T>(value: T): T {
  if (typeof value === "string") return normalizeBrandSpelling(value) as T;
  if (Array.isArray(value)) return value.map(entry => normalizeBrandText(entry)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeBrandText(entry)])) as T;
  }
  return value;
}

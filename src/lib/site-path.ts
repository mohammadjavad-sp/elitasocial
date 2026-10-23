/** Build-time prefix for GitHub project Pages; empty for normal Node hosting. */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

export function sitePath(path: string) {
  return path.startsWith("/") ? `${basePath}${path}` : path;
}

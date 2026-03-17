/**
 * Safely join a base URL and a path, ensuring no double slashes 
 * and de-duplicating /api/v1 if present in both.
 */
export function safelyJoinPath(base: string, path: string): string {
  if (!base) return path;
  const baseClean = base.endsWith('/') ? base.slice(0, -1) : base;
  const pathClean = path.startsWith('/') ? path : `/${path}`;
  
  // De-duplicate /api/v1 if both have it
  if (baseClean.endsWith('/api/v1') && pathClean.startsWith('/api/v1')) {
    return baseClean + pathClean.slice(7);
  }
  
  return baseClean + pathClean;
}

export type DifficultWordItem = { term: string; description: string };

/** `e4dda755` / `origin/feature/UI` の `GlossaryModal.normalizeDifficultWords` と同じ */
export function normalizeDifficultWords(raw: unknown): DifficultWordItem[] {
  if (raw == null) return [];

  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  const out: DifficultWordItem[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const term = typeof record.term === 'string' ? record.term.trim() : '';
    const description =
      typeof record.description === 'string'
        ? record.description
        : typeof record.body === 'string'
          ? record.body
          : '';

    if (term) {
      out.push({ term, description });
    }
  }

  return out;
}

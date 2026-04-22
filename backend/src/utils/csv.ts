/**
 * Minimal RFC 4180-ish CSV parser. Handles quoted fields, embedded commas,
 * embedded newlines, and "" escaping. Returns rows as an array of arrays.
 *
 * We deliberately avoid pulling in a CSV library because the only consumer
 * here is the vendor bulk product upload, and the files involved are small.
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      cur.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      // Treat \r\n as a single row delimiter (let \n commit the row), but
      // commit immediately on a bare \r (classic Mac line endings).
      if (input[i + 1] !== "\n") {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      }
      i++;
      continue;
    }
    if (ch === "\n") {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }

  // last field / row
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

/**
 * Parse a CSV string into an array of objects keyed by the header row.
 * Trims whitespace around header names.
 */
export function parseCsvAsObjects(
  input: string
): { headers: string[]; rows: Record<string, string>[] } {
  const raw = parseCsv(input);
  if (raw.length === 0) return { headers: [], rows: [] };
  const headers = raw[0].map((h) => h.trim());
  const rows = raw.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? "").trim();
    });
    return obj;
  });
  return { headers, rows };
}

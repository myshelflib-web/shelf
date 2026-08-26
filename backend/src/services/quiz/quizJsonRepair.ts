/**
 * Repair common LLM JSON mistakes so quiz generation is not lost to a
 * trailing comma or an unquoted key (V8: "Expected double-quoted property name").
 */
export function repairQuizJson(raw: string): string {
  const stripped = stripComments(raw);
  const escaped = escapeStrings(stripped);
  const quoted = quoteBareKeys(escaped);
  return quoted.replace(/,\s*([}\]])/g, "$1");
}

export function closeTruncatedJson(raw: string): string {
  let inString = false;
  let escaped = false;
  const stack: string[] = [];
  for (const ch of raw) {
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  let out = raw.trimEnd();
  if (inString) out += '"';
  out = out.replace(/,\s*$/, "");
  while (stack.length) out += stack.pop();
  return out;
}

function stripComments(raw: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const next = raw[i + 1];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < raw.length && raw[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < raw.length && !(raw[i] === "*" && raw[i + 1] === "/")) i++;
      i++;
      continue;
    }
    out += ch;
  }
  return out;
}

function quoteBareKeys(raw: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if ((ch === "{" || ch === ",") && i + 1 < raw.length) {
      out += ch;
      let j = i + 1;
      while (j < raw.length && /\s/.test(raw[j])) {
        out += raw[j];
        j++;
      }
      if (raw[j] === '"') {
        i = j - 1;
        continue;
      }
      const m = raw.slice(j).match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:/);
      if (m) {
        out += `"${m[1]}"`;
        i = j + m[1].length - 1;
        continue;
      }
      i = j - 1;
      continue;
    }
    out += ch;
  }
  return out;
}

function escapeStrings(raw: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (!inString) {
      if (ch === '"') inString = true;
      out += ch;
      continue;
    }
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      const next = raw[i + 1];
      if (next === "u" && /^[0-9a-fA-F]{4}/.test(raw.slice(i + 2, i + 6))) {
        out += ch;
        escaped = true;
      } else if (next && '"\\/bfnrt'.includes(next) && !isLatexCommand(raw, i)) {
        out += ch;
        escaped = true;
      } else {
        out += "\\\\";
      }
      continue;
    }
    if (ch === '"') {
      inString = false;
      out += ch;
      continue;
    }
    if (ch === "\n") {
      out += "\\n";
      continue;
    }
    if (ch === "\r") {
      out += "\\r";
      continue;
    }
    if (ch === "\t") {
      out += "\\t";
      continue;
    }
    out += ch;
  }
  return out;
}

/** `\frac` is LaTeX, not JSON form-feed; `\n` alone is a real newline escape. */
function isLatexCommand(raw: string, slashIndex: number): boolean {
  const next = raw[slashIndex + 1];
  if (!next || !"fnrtb".includes(next)) return false;
  const after = raw[slashIndex + 2];
  return Boolean(after && /[A-Za-z]/.test(after));
}

export function userFacingQuizParseError(err: unknown): string {
  const m = err instanceof Error ? err.message : String(err);
  if (
    /JSON|double-quoted|Unexpected token|Unexpected end|quiz model did not return/i.test(
      m
    )
  ) {
    return "The paper came back malformed. Try again, or use fewer questions.";
  }
  return m.slice(0, 400) || "Could not generate this quiz.";
}

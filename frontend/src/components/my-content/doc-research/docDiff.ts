/** Minimal line diff for Doc history compare. */
export function diffLines(a: string, b: string): string {
  const al = a.split(/\n/);
  const bl = b.split(/\n/);
  const max = Math.max(al.length, bl.length);
  const out: string[] = [];
  for (let i = 0; i < max; i++) {
    const left = al[i];
    const right = bl[i];
    if (left === right) {
      if (left != null) out.push(`  ${left}`);
      continue;
    }
    if (left != null) out.push(`- ${left}`);
    if (right != null) out.push(`+ ${right}`);
  }
  return out.join("\n") || "(identical)";
}

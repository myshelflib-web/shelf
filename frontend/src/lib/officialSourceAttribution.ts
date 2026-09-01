export type OfficialSourceAttribution = {
  label: string;
  url: string;
};

/** Map known official hosts to a short publisher label for the PDF attribution bar. */
export function formatOfficialSourceAttribution(
  sourceUrl: string | null | undefined
): OfficialSourceAttribution | null {
  const raw = sourceUrl?.trim();
  if (!raw) return null;
  let host: string;
  try {
    host = new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }

  let label = "Official source";
  if (host.includes("ncert.nic.in")) label = "NCERT";
  else if (host.includes("upsc.gov.in")) label = "UPSC";
  else if (host.includes("indiabudget.gov.in")) label = "India Budget";
  else if (host.endsWith(".gov.in") || host.endsWith(".nic.in")) {
    label = host.replace(/^www\./, "");
  }

  return { label, url: raw };
}

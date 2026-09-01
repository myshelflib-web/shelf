/** Shared helpers for Grafana / OpenTelemetry export (when OTEL_EXPORTER_OTLP_ENDPOINT is set). */

export function otelExportEnabled(): boolean {
  return Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim());
}

export function otelAttributes(
  fields?: Record<string, unknown>
): Record<string, string | number | boolean> {
  if (!fields) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
    } else {
      out[key] = JSON.stringify(value);
    }
  }
  return out;
}

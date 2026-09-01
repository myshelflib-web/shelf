import {
  type Counter,
  type Histogram,
  metrics as otelApi,
} from "@opentelemetry/api";
import { otelAttributes, otelExportEnabled } from "./otelBridge.js";

export type MetricLabels = Record<string, string | number | boolean>;

interface CounterEntry {
  value: number;
  labels: MetricLabels;
}

interface HistogramEntry {
  count: number;
  sumMs: number;
  minMs: number;
  maxMs: number;
  labels: MetricLabels;
}

function labelKey(name: string, labels?: MetricLabels): string {
  if (!labels || Object.keys(labels).length === 0) return name;
  const sorted = Object.keys(labels)
    .sort()
    .map((k) => `${k}=${String(labels[k])}`)
    .join(",");
  return `${name}{${sorted}}`;
}

const counters = new Map<string, CounterEntry>();
const histograms = new Map<string, HistogramEntry>();
const startedAt = Date.now();

const otelMeter = otelExportEnabled()
  ? otelApi.getMeter("shelf-app")
  : undefined;
const otelCounters = new Map<string, Counter>();
const otelHistograms = new Map<string, Histogram>();

function otelCounter(name: string): Counter | undefined {
  if (!otelMeter) return undefined;
  let counter = otelCounters.get(name);
  if (!counter) {
    counter = otelMeter.createCounter(name);
    otelCounters.set(name, counter);
  }
  return counter;
}

function otelHistogram(name: string): Histogram | undefined {
  if (!otelMeter) return undefined;
  let histogram = otelHistograms.get(name);
  if (!histogram) {
    histogram = otelMeter.createHistogram(name, { unit: "ms" });
    otelHistograms.set(name, histogram);
  }
  return histogram;
}

export const metrics = {
  inc(name: string, labels?: MetricLabels, by = 1): void {
    const key = labelKey(name, labels);
    const existing = counters.get(key);
    if (existing) {
      existing.value += by;
    } else {
      counters.set(key, { value: by, labels: labels ?? {} });
    }

    otelCounter(name)?.add(by, otelAttributes(labels));
  },

  observe(name: string, durationMs: number, labels?: MetricLabels): void {
    const key = labelKey(name, labels);
    const existing = histograms.get(key);
    if (existing) {
      existing.count += 1;
      existing.sumMs += durationMs;
      existing.minMs = Math.min(existing.minMs, durationMs);
      existing.maxMs = Math.max(existing.maxMs, durationMs);
    } else {
      histograms.set(key, {
        count: 1,
        sumMs: durationMs,
        minMs: durationMs,
        maxMs: durationMs,
        labels: labels ?? {},
      });
    }

    otelHistogram(name)?.record(durationMs, otelAttributes(labels));
  },

  async time<T>(
    name: string,
    fn: () => Promise<T>,
    labels?: MetricLabels
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.observe(name, Date.now() - start, { ...labels, ok: true });
      return result;
    } catch (err) {
      this.observe(name, Date.now() - start, { ...labels, ok: false });
      throw err;
    }
  },

  snapshot() {
    const counterOut: Record<
      string,
      { value: number; labels: MetricLabels }
    > = {};
    for (const [key, entry] of counters) {
      counterOut[key] = { value: entry.value, labels: entry.labels };
    }

    const histogramOut: Record<
      string,
      {
        count: number;
        sumMs: number;
        avgMs: number;
        minMs: number;
        maxMs: number;
        labels: MetricLabels;
      }
    > = {};
    for (const [key, entry] of histograms) {
      histogramOut[key] = {
        count: entry.count,
        sumMs: entry.sumMs,
        avgMs: entry.count ? Math.round(entry.sumMs / entry.count) : 0,
        minMs: entry.minMs,
        maxMs: entry.maxMs,
        labels: entry.labels,
      };
    }

    return {
      uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
      counters: counterOut,
      histograms: histogramOut,
    };
  },
};

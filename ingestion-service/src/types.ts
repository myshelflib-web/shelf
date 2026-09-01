export type IngestQueueMessage = {
  phase: "POLL" | "FETCH" | "PROCESS" | "PROMOTE" | "ARCHIVE";
  sourceId?: string;
  itemId?: string;
  jobId?: string;
};

export const QUEUE_ENV_KEYS = {
  POLL: "INGEST_SQS_POLL_QUEUE_URL",
  FETCH: "INGEST_SQS_FETCH_QUEUE_URL",
  PROCESS: "INGEST_SQS_PROCESS_QUEUE_URL",
  PROMOTE: "INGEST_SQS_PROMOTE_QUEUE_URL",
  ARCHIVE: "INGEST_SQS_ARCHIVE_QUEUE_URL",
} as const;

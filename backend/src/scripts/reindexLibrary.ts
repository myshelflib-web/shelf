import "dotenv/config";
import { runVectorIndexBatch } from "../services/vectorIndexWorker.js";
import { logger, errorFields } from "../utils/logger.js";

const batchSize = Math.min(Number(process.argv[2] ?? 50), 200);

runVectorIndexBatch(batchSize)
  .then((indexed) => {
    logger.info("vector.reindex.done", { indexed, batchSize });
    process.exit(0);
  })
  .catch((err) => {
    logger.error("vector.reindex.failed", errorFields(err));
    process.exit(1);
  });

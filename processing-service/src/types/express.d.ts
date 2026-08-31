import type { logger } from "../utils/logger.js";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      log?: ReturnType<typeof logger.child>;
    }
  }
}

export {};

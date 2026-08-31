import type { Request } from "express";
import { errorFields, logger, type LogFields } from "./logger.js";

type FlowLogger = Pick<typeof logger, "debug" | "info" | "warn" | "error">;

export function reqLog(req?: Pick<Request, "log">): FlowLogger {
  return req?.log ?? logger;
}

function logOk(log: FlowLogger, event: string, fields?: LogFields): void {
  log.info(event, fields);
}

function logFail(log: FlowLogger, event: string, err: unknown, fields?: LogFields): void {
  log.error(event, { ...fields, ...errorFields(err) });
}

function logWarn(log: FlowLogger, event: string, fields?: LogFields): void {
  log.warn(event, fields);
}

export const userFlow = {
  created(log: FlowLogger, fields: LogFields): void {
    logOk(log, "user.created", fields);
  },
  deleted(log: FlowLogger, fields: LogFields): void {
    logOk(log, "user.deleted", fields);
  },
  updated(log: FlowLogger, fields: LogFields): void {
    logOk(log, "user.updated", fields);
  },
  otpSent(log: FlowLogger, fields: LogFields): void {
    logOk(log, "user.otp.sent", fields);
  },
  otpFailed(log: FlowLogger, fields: LogFields): void {
    logWarn(log, "user.otp.failed", fields);
  },
  passwordReset(log: FlowLogger, fields: LogFields): void {
    logOk(log, "user.password.reset", fields);
  },
};

export const contentFlow = {
  uploadInit(log: FlowLogger, fields: LogFields): void {
    logOk(log, "content.upload.init", fields);
  },
  uploadComplete(log: FlowLogger, fields: LogFields): void {
    logOk(log, "content.upload.complete", fields);
  },
  uploadFailed(log: FlowLogger, err: unknown, fields?: LogFields): void {
    logFail(log, "content.upload.failed", err, fields);
  },
  pageCreated(log: FlowLogger, fields: LogFields): void {
    logOk(log, "content.page.created", fields);
  },
  pageDeleted(log: FlowLogger, fields: LogFields): void {
    logOk(log, "content.page.deleted", fields);
  },
  collectionCreated(log: FlowLogger, fields: LogFields): void {
    logOk(log, "content.collection.created", fields);
  },
  collectionDeleted(log: FlowLogger, fields: LogFields): void {
    logOk(log, "content.collection.deleted", fields);
  },
  topicCreated(log: FlowLogger, fields: LogFields): void {
    logOk(log, "content.topic.created", fields);
  },
  importDone(log: FlowLogger, fields: LogFields): void {
    logOk(log, "content.import.done", fields);
  },
  youtubeImport(log: FlowLogger, fields: LogFields): void {
    logOk(log, "content.youtube.import", fields);
  },
};

export const studyFlow = {
  askStart(log: FlowLogger, fields: LogFields): void {
    logOk(log, "study.ask.start", fields);
  },
  askOk(log: FlowLogger, fields: LogFields): void {
    logOk(log, "study.ask.ok", fields);
  },
  askFailed(log: FlowLogger, err: unknown, fields?: LogFields): void {
    logFail(log, "study.ask.failed", err, fields);
  },
  streamStart(log: FlowLogger, fields: LogFields): void {
    logOk(log, "study.stream.start", fields);
  },
  streamOk(log: FlowLogger, fields: LogFields): void {
    logOk(log, "study.stream.ok", fields);
  },
  streamFailed(log: FlowLogger, err: unknown, fields?: LogFields): void {
    logFail(log, "study.stream.failed", err, fields);
  },
  ragStart(log: FlowLogger, fields: LogFields): void {
    log.debug("study.rag.start", fields);
  },
  ragOk(log: FlowLogger, fields: LogFields): void {
    logOk(log, "study.rag.ok", fields);
  },
  threadCreated(log: FlowLogger, fields: LogFields): void {
    logOk(log, "study.thread.created", fields);
  },
  threadDeleted(log: FlowLogger, fields: LogFields): void {
    logOk(log, "study.thread.deleted", fields);
  },
  relevancySaved(log: FlowLogger, fields: LogFields): void {
    logOk(log, "study.relevancy.saved", fields);
  },
};

export const quizFlow = {
  generateStart(log: FlowLogger, fields: LogFields): void {
    logOk(log, "quiz.generate.start", fields);
  },
  generateOk(log: FlowLogger, fields: LogFields): void {
    logOk(log, "quiz.generate.ok", fields);
  },
  generateFailed(log: FlowLogger, err: unknown, fields?: LogFields): void {
    logFail(log, "quiz.generate.failed", err, fields);
  },
  submitted(log: FlowLogger, fields: LogFields): void {
    logOk(log, "quiz.submitted", fields);
  },
  graded(log: FlowLogger, fields: LogFields): void {
    logOk(log, "quiz.graded", fields);
  },
  gradeFailed(log: FlowLogger, err: unknown, fields?: LogFields): void {
    logFail(log, "quiz.grade.failed", err, fields);
  },
};

export const plannerFlow = {
  created(log: FlowLogger, fields: LogFields): void {
    logOk(log, "planner.item.created", fields);
  },
  updated(log: FlowLogger, fields: LogFields): void {
    logOk(log, "planner.item.updated", fields);
  },
  deleted(log: FlowLogger, fields: LogFields): void {
    logOk(log, "planner.item.deleted", fields);
  },
  completed(log: FlowLogger, fields: LogFields): void {
    logOk(log, "planner.item.completed", fields);
  },
};

export const billingFlow = {
  checkoutStart(log: FlowLogger, fields: LogFields): void {
    logOk(log, "billing.checkout.start", fields);
  },
  checkoutOk(log: FlowLogger, fields: LogFields): void {
    logOk(log, "billing.checkout.ok", fields);
  },
  checkoutFailed(log: FlowLogger, err: unknown, fields?: LogFields): void {
    logFail(log, "billing.checkout.failed", err, fields);
  },
  webhook(log: FlowLogger, fields: LogFields): void {
    logOk(log, "billing.webhook", fields);
  },
  subscriptionChanged(log: FlowLogger, fields: LogFields): void {
    logOk(log, "billing.subscription.changed", fields);
  },
};

export const llmFlow = {
  request(log: FlowLogger, fields: LogFields): void {
    log.debug("llm.request", fields);
  },
  ok(log: FlowLogger, fields: LogFields): void {
    logOk(log, "llm.ok", fields);
  },
  failed(log: FlowLogger, err: unknown, fields?: LogFields): void {
    logFail(log, "llm.failed", err, fields);
  },
  quota(log: FlowLogger, fields: LogFields): void {
    logWarn(log, "llm.quota", fields);
  },
};

export const integrationFlow = {
  telegramWebhook(log: FlowLogger, fields: LogFields): void {
    logOk(log, "telegram.webhook", fields);
  },
  telegramLinked(log: FlowLogger, fields: LogFields): void {
    logOk(log, "telegram.linked", fields);
  },
  affiliateAttributed(log: FlowLogger, fields: LogFields): void {
    logOk(log, "affiliate.attributed", fields);
  },
  adminAction(log: FlowLogger, fields: LogFields): void {
    logOk(log, "admin.action", fields);
  },
};

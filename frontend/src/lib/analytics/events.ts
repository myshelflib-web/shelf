/** Canonical event names and shared property keys for product analytics. */

export const AnalyticsEvents = {
  // Activation funnel
  signupCompleted: "signup_completed",
  onboardingStepViewed: "onboarding_step_viewed",
  onboardingCompleted: "onboarding_completed",
  onboardingSkipped: "onboarding_skipped",
  onboardingAbandoned: "onboarding_abandoned",
  firstUploadStarted: "first_upload_started",
  firstUploadCompleted: "first_upload_completed",
  firstUploadFailed: "first_upload_failed",
  firstPageOpened: "first_page_opened",

  // Core loops
  readerOpened: "reader_opened",
  highlightCreated: "highlight_created",
  studyAiMessageSent: "study_ai_message_sent",
  quizGenerated: "quiz_generated",
  quizSubmitted: "quiz_submitted",
  plannerTaskCreated: "planner_task_created",
  plannerTaskCompleted: "planner_task_completed",
  searchOpened: "search_opened",
  searchResultClicked: "search_result_clicked",

  // Stuck / failure signals
  uploadError: "upload_error",
  pdfProcessingFailed: "pdf_processing_failed",
  studyAiStreamError: "study_ai_stream_error",
  quizGenerationFailed: "quiz_generation_failed",
  clientError: "client_error",
  apiRequestFailed: "api_request_failed",
  componentError: "component_error",
  chunkLoadFailed: "chunk_load_failed",

  // Power features
  readerSplitEnabled: "reader_split_enabled",
  spotifyDockOpened: "spotify_dock_opened",
  telegramLinked: "telegram_linked",
  shareStreakExported: "share_streak_exported",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/** localStorage flags for once-per-user funnel events */
export const AnalyticsFirstTimeFlags = {
  uploadStarted: "first-upload-started",
  uploadCompleted: "first-upload-completed",
  uploadFailed: "first-upload-failed",
  pageOpened: "first-page-opened",
} as const;

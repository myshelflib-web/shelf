import { describe, expect, it, afterEach } from "vitest";
import {
  embeddingApiKey,
  embeddingBaseUrl,
  embeddingModel,
  geminiEmbeddingModelId,
  geminiEmbeddingModelSlug,
  isGroqBaseUrl,
  isGeminiBaseUrl,
  llmBaseUrl,
  chatModel,
  chatModelCandidates,
  clearWorkingChatModel,
  isModelUnavailableError,
  rememberWorkingChatModel,
  parseProviderError,
  resolveGeminiChatModel,
  resolveGeminiEmbeddingModel,
  sanitizeSecret,
} from "./llmConfig.js";

describe("llmConfig", () => {
  const keys = [
    "LLM_BASE_URL",
    "EMBEDDING_MODEL",
    "EMBEDDING_BASE_URL",
    "EMBEDDING_API_KEY",
    "LLM_MODEL",
    "LLM_API_KEY",
  ] as const;
  const saved: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
      delete saved[k];
    }
  });

  function setEnv(k: (typeof keys)[number], v: string | undefined) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }

  it("defaults Gemini chat + embedding hosts when unset", () => {
    setEnv("LLM_BASE_URL", undefined);
    setEnv("LLM_MODEL", undefined);
    setEnv("EMBEDDING_MODEL", undefined);
    setEnv("EMBEDDING_BASE_URL", undefined);
    expect(llmBaseUrl()).toBe(
      "https://generativelanguage.googleapis.com/v1beta/openai"
    );
    expect(chatModel()).toBe("gemini-flash-lite-latest");
    expect(embeddingBaseUrl()).toBe(
      "https://generativelanguage.googleapis.com/v1beta/openai"
    );
    expect(embeddingModel()).toBe("gemini-embedding-001");
  });

  it("remaps retired gemini-2.5-flash for new API keys", () => {
    setEnv("LLM_MODEL", "gemini-2.5-flash");
    expect(chatModel()).toBe("gemini-flash-latest");
    expect(resolveGeminiChatModel("models/gemini-2.5-flash")).toBe(
      "gemini-flash-latest"
    );
  });

  it("builds Gemini fallback candidates and remembers a working model", () => {
    clearWorkingChatModel();
    setEnv("LLM_MODEL", "gemini-2.5-flash");
    setEnv(
      "LLM_BASE_URL",
      "https://generativelanguage.googleapis.com/v1beta/openai"
    );
    const first = chatModelCandidates();
    expect(first[0]).toBe("gemini-flash-latest");
    expect(first).toContain("gemini-flash-lite-latest");

    rememberWorkingChatModel(llmBaseUrl(), "gemini-3.6-flash");
    expect(chatModelCandidates()[0]).toBe("gemini-3.6-flash");
    clearWorkingChatModel();
  });

  it("detects model-unavailable provider errors", () => {
    expect(isModelUnavailableError(404, "")).toBe(true);
    expect(
      isModelUnavailableError(
        400,
        "This model models/gemini-2.5-flash is no longer available to new users."
      )
    ).toBe(true);
    expect(isModelUnavailableError(401, "invalid key")).toBe(false);
  });

  it("defaults OpenAI embedding model when chat base is OpenAI", () => {
    setEnv("LLM_BASE_URL", "https://api.openai.com/v1");
    setEnv("LLM_MODEL", "gpt-4o-mini");
    setEnv("EMBEDDING_MODEL", undefined);
    setEnv("EMBEDDING_BASE_URL", undefined);
    expect(embeddingModel()).toBe("text-embedding-3-small");
    expect(embeddingBaseUrl()).toBe("https://api.openai.com/v1");
  });

  it("defaults Ollama embedding model when base URL is local", () => {
    setEnv("LLM_BASE_URL", "http://localhost:11434/v1");
    setEnv("LLM_MODEL", undefined);
    setEnv("EMBEDDING_MODEL", undefined);
    setEnv("EMBEDDING_BASE_URL", undefined);
    expect(embeddingModel()).toBe("nomic-embed-text");
  });

  it("when chat is Groq, embedding base falls back to OpenAI unless overridden", () => {
    setEnv("LLM_BASE_URL", "https://api.groq.com/openai/v1");
    setEnv("LLM_MODEL", "llama-3.1-8b-instant");
    setEnv("EMBEDDING_BASE_URL", undefined);
    setEnv("EMBEDDING_MODEL", undefined);
    expect(isGroqBaseUrl(process.env.LLM_BASE_URL!)).toBe(true);
    expect(embeddingBaseUrl()).toBe("https://api.openai.com/v1");
  });

  it("uses Gemini embedding defaults when EMBEDDING_BASE_URL is Gemini", () => {
    setEnv(
      "EMBEDDING_BASE_URL",
      "https://generativelanguage.googleapis.com/v1beta/openai"
    );
    setEnv("EMBEDDING_MODEL", undefined);
    expect(embeddingModel()).toBe("gemini-embedding-001");
  });

  it("respects explicit EMBEDDING_MODEL", () => {
    setEnv("LLM_BASE_URL", "http://localhost:11434/v1");
    setEnv("EMBEDDING_MODEL", "text-embedding-3-small");
    expect(embeddingModel()).toBe("text-embedding-3-small");
  });

  it("detects Gemini hosts for native embedding routing", () => {
    setEnv(
      "EMBEDDING_BASE_URL",
      "https://generativelanguage.googleapis.com/v1beta/openai"
    );
    expect(isGeminiBaseUrl(embeddingBaseUrl())).toBe(true);
    expect(geminiEmbeddingModelSlug("text-embedding-004")).toBe(
      "text-embedding-004"
    );
    expect(geminiEmbeddingModelId("gemini-embedding-001")).toBe(
      "models/gemini-embedding-001"
    );
  });

  it("remaps retired Gemini embedding models", () => {
    setEnv(
      "EMBEDDING_BASE_URL",
      "https://generativelanguage.googleapis.com/v1beta/openai"
    );
    setEnv("EMBEDDING_MODEL", "text-embedding-004");
    expect(embeddingModel()).toBe("gemini-embedding-001");
    expect(resolveGeminiEmbeddingModel("text-embedding-004")).toBe(
      "gemini-embedding-001"
    );
  });

  it("does not fall back to Groq chat key for Gemini embeddings", () => {
    setEnv(
      "EMBEDDING_BASE_URL",
      "https://generativelanguage.googleapis.com/v1beta/openai"
    );
    setEnv("EMBEDDING_API_KEY", undefined);
    setEnv("LLM_API_KEY", "gsk_test");
    expect(embeddingApiKey()).toBeUndefined();
  });

  it("strips quotes from secrets", () => {
    expect(sanitizeSecret('"AQ.abc"')).toBe("AQ.abc");
    expect(sanitizeSecret("  AQ.abc  ")).toBe("AQ.abc");
  });

  it("parses Gemini array-wrapped provider errors", () => {
    const body = JSON.stringify([
      {
        error: {
          code: 400,
          message:
            "Function call is missing a thought_signature in functionCall parts.",
        },
      },
    ]);
    expect(parseProviderError(body)).toContain("thought_signature");
  });
});

import { describe, expect, it, afterEach } from "vitest";
import {
  isVectorConfigured,
  vectorProvider,
} from "./vectorStoreTypes.js";

describe("vectorStoreTypes", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("defaults to qdrant when VECTOR_DB_PROVIDER is unset", () => {
    delete process.env.VECTOR_DB_PROVIDER;
    expect(vectorProvider()).toBe("qdrant");
  });

  it("treats pgvector, postgres, and neon as pgvector", () => {
    for (const value of ["pgvector", "postgres", "neon", "PgVector"]) {
      process.env.VECTOR_DB_PROVIDER = value;
      expect(vectorProvider()).toBe("pgvector");
    }
  });

  it("requires VECTOR_DB_URL for qdrant", () => {
    process.env.VECTOR_DB_PROVIDER = "qdrant";
    delete process.env.VECTOR_DB_URL;
    expect(isVectorConfigured()).toBe(false);

    process.env.VECTOR_DB_URL = "http://localhost:6333";
    expect(isVectorConfigured()).toBe(true);
  });

  it("requires DATABASE_URL for pgvector", () => {
    process.env.VECTOR_DB_PROVIDER = "pgvector";
    delete process.env.DATABASE_URL;
    expect(isVectorConfigured()).toBe(false);

    process.env.DATABASE_URL = "postgresql://local/test";
    expect(isVectorConfigured()).toBe(true);
  });

  it("uses pgvector when provider is pgvector even if VECTOR_DB_URL is set", () => {
    process.env.VECTOR_DB_PROVIDER = "pgvector";
    process.env.DATABASE_URL = "postgresql://local/test";
    process.env.VECTOR_DB_URL = "http://localhost:6333";
    expect(vectorProvider()).toBe("pgvector");
    expect(isVectorConfigured()).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { entityKeysFromApiPath } from "./entitySyncKeys";
import {
  isRetryableMutationMethod,
  shouldEnqueueMutationRetry,
} from "./apiRequestSync";

describe("entityKeysFromApiPath", () => {
  it("extracts page, subject, and topic ids", () => {
    expect(
      entityKeysFromApiPath(
        "/api/my-content/pages/6a4f896c-0fa0-4981-9f9c-5da61f28cf42/title"
      )
    ).toEqual(["page:6a4f896c-0fa0-4981-9f9c-5da61f28cf42"]);
    expect(
      entityKeysFromApiPath(
        "/api/my-content/subjects/6a4f896c-0fa0-4981-9f9c-5da61f28cf42"
      )
    ).toEqual(["subject:6a4f896c-0fa0-4981-9f9c-5da61f28cf42"]);
    expect(
      entityKeysFromApiPath(
        "/api/my-content/subjects/6a4f896c-0fa0-4981-9f9c-5da61f28cf42/topic-groups/7b5f896c-0fa0-4981-9f9c-5da61f28cf43"
      )
    ).toEqual([
      "topic:7b5f896c-0fa0-4981-9f9c-5da61f28cf43",
      "subject:6a4f896c-0fa0-4981-9f9c-5da61f28cf42",
    ]);
  });
});

describe("shouldEnqueueMutationRetry", () => {
  it("retries PATCH/PUT/DELETE on transient errors only", () => {
    expect(isRetryableMutationMethod("PATCH")).toBe(true);
    expect(isRetryableMutationMethod("POST")).toBe(false);
    expect(
      shouldEnqueueMutationRetry(
        "/api/my-content/pages/6a4f896c-0fa0-4981-9f9c-5da61f28cf42/title",
        "PATCH",
        { status: 0 }
      )
    ).toBe(true);
    expect(
      shouldEnqueueMutationRetry(
        "/api/my-content/pages/6a4f896c-0fa0-4981-9f9c-5da61f28cf42/title",
        "PATCH",
        { status: 500 }
      )
    ).toBe(true);
    expect(
      shouldEnqueueMutationRetry(
        "/api/my-content/pages/6a4f896c-0fa0-4981-9f9c-5da61f28cf42/title",
        "PATCH",
        { status: 404 }
      )
    ).toBe(false);
    expect(
      shouldEnqueueMutationRetry(
        "/api/my-content/subjects",
        "POST",
        { status: 500 }
      )
    ).toBe(false);
  });
});

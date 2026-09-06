/** Strip a bucket path accidentally appended to the R2 endpoint. */
const endpoint = process.env.S3_ENDPOINT;
if (endpoint?.includes("r2.cloudflarestorage.com")) {
  try {
    const url = new URL(endpoint);
    // Only clear a path like /shelf — never eat the hostname.
    if (url.pathname && url.pathname !== "/") {
      process.env.S3_ENDPOINT = url.origin;
    }
  } catch {
    /* leave as-is */
  }
}

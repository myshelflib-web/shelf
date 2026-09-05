/** Strip a bucket path accidentally appended to the R2 endpoint. */
if (process.env.S3_ENDPOINT?.includes("r2.cloudflarestorage.com")) {
  process.env.S3_ENDPOINT = process.env.S3_ENDPOINT.replace(/\/[^/]+\/?$/, "");
}

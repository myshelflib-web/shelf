import { getObjectBuffer, uploadToS3 } from "../s3.js";
import { blogContentKey } from "../../utils/blogPaths.js";
import {
  parseBlogContent,
  type BlogPostContent,
} from "./types.js";

export async function readBlogContent(contentKey: string): Promise<BlogPostContent> {
  const { buffer } = await getObjectBuffer(contentKey);
  const parsed = JSON.parse(buffer.toString("utf8")) as unknown;
  return parseBlogContent(parsed);
}

export async function writeBlogContent(
  slug: string,
  content: BlogPostContent
): Promise<string> {
  const key = blogContentKey(slug);
  await uploadToS3(key, JSON.stringify(content, null, 2), "application/json");
  return key;
}

export async function uploadBlogAsset(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await uploadToS3(key, body, contentType);
  return key;
}

import { ImageResponse } from "next/og";
import { shelfPwaIconImage } from "@/lib/pwaIconImage";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(shelfPwaIconImage(512), {
    width: 512,
    height: 512,
  });
}

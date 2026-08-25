import { ImageResponse } from "next/og";
import { shelfPwaIconImage } from "@/lib/pwaIconImage";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(shelfPwaIconImage(180), {
    ...size,
  });
}

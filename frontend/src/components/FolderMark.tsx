import { Folder } from "lucide-react";
import { folderTone } from "@/lib/folderTone";

export function FolderMark({
  seed,
  size = 16,
  className = "",
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const tone = folderTone(seed);
  const box = size + 12;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md shrink-0 ${className}`}
      style={{
        width: box,
        height: box,
        background: tone.bg,
        color: tone.fg,
      }}
      aria-hidden
    >
      <Folder style={{ width: size, height: size }} strokeWidth={1.75} />
    </span>
  );
}

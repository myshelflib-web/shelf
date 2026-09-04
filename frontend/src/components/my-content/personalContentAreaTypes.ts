import type { MutableRefObject } from "react";
import type { UserContentHighlight } from "@/types";
import type { AnnotationGate } from "@/lib/preloadedReadOnly";
import type { SketchZoomCommands } from "./useSketchNotebookZoom";
import type { HtmlReadingWidth } from "./HtmlDocToolbar";

export type PersonalContentAreaProps = {
  content: string;
  userTopicId: string;
  highlights: UserContentHighlight[];
  onHighlightsChange: (highlights: UserContentHighlight[]) => void;
  onAskSelection?: (
    text: string,
    imageBase64?: string,
    attachNote?: (note: string) => Promise<void>
  ) => void;
  editing?: boolean;
  onContentChange?: (html: string) => void;
  clipMode?: boolean;
  eraseMode?: boolean;
  preferredHighlightColorId?: string;
  readingWidth?: HtmlReadingWidth;
  contentScale?: number;
  annotationGate?: AnnotationGate | null;
  onClip?: (imageDataUrl: string) => void;
  onReadProgress?: (percent: number) => void;
  onScrollContainer?: (el: HTMLElement | null) => void;
  onContentRoot?: (el: HTMLElement | null) => void;
  initialScrollTop?: number;
  initialScrollLeft?: number;
  initialScale?: number;
  zoomCommandsRef?: MutableRefObject<SketchZoomCommands | null>;
  onViewStateChange?: (state: {
    scrollTop: number;
    scrollLeft?: number;
    scale?: number;
  }) => void;
  readOnly?: boolean;
  guestLocked?: boolean;
  onGuestLockedClick?: (feature: string) => void;
  compactEditor?: boolean;
};

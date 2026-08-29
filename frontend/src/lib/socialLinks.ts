export const SOCIAL_LINKS = [
  {
    id: "instagram",
    name: "Instagram",
    href: "https://www.instagram.com/myshelflib/",
  },
  {
    id: "youtube",
    name: "YouTube",
    href: "https://www.youtube.com/@Shelf-l6s",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/shelf-library-b92105432/",
  },
] as const;

export const SOCIAL_SAME_AS = SOCIAL_LINKS.map((link) => link.href);

import type { TagItem } from "./lib/contentful";

interface TOCItem {
  id: string;
  text: string;
  level: "h2" | "h3" | "h4" | "h5" | "h6";
}

interface PostListItem {
  title: string;
  slug: string;
  description: string;
  tags: TagItem[];
  date: string;
}
[];

export type { TOCItem, PostListItem };

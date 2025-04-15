import type { TagLink } from "contentful";

interface TOCItem {
  id: string;
  text: string;
  level: "h2" | "h3" | "h4" | "h5" | "h6";
}

interface PostListItem {
  title: string;
  slug: string;
  description: string;
  tags: {
    sys: TagLink;
  }[];
  date: string;
}
[];

export type { TOCItem, PostListItem };

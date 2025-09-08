import { formatDate } from "@/helpers";
import type { PostListItem } from "@/types";
import * as contentful from "contentful";
import type { EntryFieldTypes, Entry, UnresolvedLink, Asset } from "contentful";
import { getPostTags } from "./post.render";

const contentfulClient = contentful.createClient({
  space: import.meta.env.CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.DEV
    ? import.meta.env.CONTENTFUL_PREVIEW_TOKEN
    : import.meta.env.CONTENTFUL_DELIVERY_TOKEN,
  host: import.meta.env.DEV ? "preview.contentful.com" : "cdn.contentful.com",
});

interface Tag {
  contentTypeId: "tag";
  fields: {
    name: EntryFieldTypes.Text;
    slug: EntryFieldTypes.Text;
  };
}

interface BlogPost {
  contentTypeId: "blogPost";
  fields: {
    image: EntryFieldTypes.AssetLink;
    title: EntryFieldTypes.Text;
    description: EntryFieldTypes.Text;
    date: EntryFieldTypes.Date;
    content: EntryFieldTypes.RichText;
    slug: EntryFieldTypes.Text;
    tags: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<Tag>>;
    relatedPosts: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<BlogPost>>;
  };
}

interface CodeBlock {
  contentTypeId: "codeBlock";
  fields: {
    code: EntryFieldTypes.Text;
    language: EntryFieldTypes.Text;
  };
}

interface MermaidBlock {
  contentTypeId: "mermaidBlock";
  fields: {
    title: EntryFieldTypes.Text;
    code: EntryFieldTypes.Text;
  };
}

interface TagItem {
  name: string;
  slug: PostListItem["slug"];
}

type CodeBlockEntry = Entry<CodeBlock>;
type MermaidBlockEntry = Entry<MermaidBlock>;
type TagUnresolvedLink =
  | UnresolvedLink<"Entry">
  | Entry<Tag, undefined, string>;

type BlogPostUnresolvedLink =
  | UnresolvedLink<"Entry">
  | Entry<BlogPost, undefined, string>;

type AssetUnresolvedLink = UnresolvedLink<"Asset"> | Asset<undefined, string>;

type Item<TFields> = {
  id: string;
  createdAt: string;
  updatedAt: string;
  fields: TFields;
};

type Page<TFields> = {
  items: Array<Item<TFields>>;
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
  nextSkip: number | null;
};

type BlogPostSkeleton = {
  contentTypeId: "blogPost";
  fields: BlogPost["fields"];
};

type BlogPostPage = Page<BlogPostSkeleton["fields"]>;
type BlogPostItem = Item<BlogPostSkeleton["fields"]>;

async function toPostListItem(
  item: Entry<BlogPost, undefined, string>
): Promise<PostListItem> {
  const {
    fields: { title, date, description, slug, tags: tagEntryLinks },
  } = item;

  const tags = await Promise.all(getPostTags(tagEntryLinks));

  return {
    title,
    slug,
    description: description || "",
    tags,
    date: formatDate(date),
  };
}

export { contentfulClient, toPostListItem };
export type {
  CodeBlockEntry,
  MermaidBlockEntry,
  BlogPost,
  TagItem,
  TagUnresolvedLink,
  AssetUnresolvedLink,
  BlogPostUnresolvedLink,
  Item,
  Page,
  BlogPostSkeleton,
  BlogPostPage,
  BlogPostItem,
};

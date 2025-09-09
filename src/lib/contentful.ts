import { formatDate } from "@/helpers";
import type { PostListItem } from "@/types";
import * as contentful from "contentful";
import type {
  EntryFieldTypes,
  Entry,
  UnresolvedLink,
  Asset,
  EntrySkeletonType,
} from "contentful";
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
  isActive?: boolean;
  href?: string;
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

interface TagSkeleton extends EntrySkeletonType {
  contentTypeId: "tag";
  fields: {
    name: EntryFieldTypes.Symbol;
    slug: EntryFieldTypes.Symbol;
  };
}

async function getAllTagItems(): Promise<TagItem[]> {
  const { items } = await contentfulClient.getEntries<TagSkeleton>({
    content_type: "tag",
    limit: 1000,
    select: ["fields.name", "fields.slug"],
  });

  return items.map((t) => ({
    name: t.fields.name,
    slug: t.fields.slug as PostListItem["slug"],
  }));
}

function getSortOrder(
  currentSort: string
): ("fields.date" | "-fields.date" | "sys.id" | "-sys.id")[] {
  if (currentSort === "ascending") return ["fields.date", "sys.id"];
  return ["-fields.date", "sys.id"];
}

async function getTagIdFromSlug(
  slug: string | null | undefined
): Promise<string | undefined> {
  let tagId: string | undefined = undefined;

  if (typeof slug === "string" && slug.length > 0) {
    const { items: tags } = await contentfulClient.getEntries<TagSkeleton>({
      content_type: "tag",
      "fields.slug": slug,
      limit: 1,
      select: ["sys.id"],
    });

    tagId = tags[0]?.sys.id;
  }

  return tagId;
}

export {
  contentfulClient,
  toPostListItem,
  getAllTagItems,
  getSortOrder,
  getTagIdFromSlug,
};
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
  TagSkeleton,
};

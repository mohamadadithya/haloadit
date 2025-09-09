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

  const tags = await Promise.all(await getPostTags(tagEntryLinks));

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
    select: ["sys.id", "fields.name", "fields.slug"],
  });

  return items.map((t) => ({
    id: t.sys.id,
    name: t.fields.name,
    slug: t.fields.slug as PostListItem["slug"],
  }));
}

type SortOrder = "ascending" | "descending";
type Mode = "delivery" | "onlyPublished" | "onlyDrafts" | "none";

let TAG_SLUG_TO_ID: Record<string, string> | null = null;

async function buildTagSlugToIdMap(): Promise<Record<string, string>> {
  const { items } = await contentfulClient.getEntries<TagSkeleton>({
    content_type: "tag",
    limit: 1000,
    select: ["sys.id", "fields.slug"],
  });
  return Object.fromEntries(
    items
      .map((t) => [t.fields.slug as string, t.sys.id] as const)
      .filter(([slug, id]) => !!slug && !!id)
  );
}

async function ensureTagMap() {
  if (!TAG_SLUG_TO_ID) TAG_SLUG_TO_ID = await buildTagSlugToIdMap();
}

function tagIdFromSlug(slug?: string | null): string | undefined {
  if (!slug || !TAG_SLUG_TO_ID) return undefined;
  return TAG_SLUG_TO_ID[slug];
}

function getSortOrder(
  currentSort: SortOrder
): ("fields.date" | "-fields.date" | "sys.id" | "-sys.id")[] {
  return currentSort === "ascending"
    ? ["fields.date", "sys.id"]
    : ["-fields.date", "sys.id"];
}

async function getPosts(current: {
  tag?: string | null;
  search?: string | null;
  sort: SortOrder;
  pageSize: number;
  skip: number;
  mode: Mode;
}): Promise<{
  items: PostListItem[];
  total: number;
  skip: number;
  limit: number;
}> {
  await ensureTagMap();

  const tagId = tagIdFromSlug(current.tag ?? null);

  if ((current.tag ?? null) && !tagId) {
    return { items: [], total: 0, skip: 0, limit: current.pageSize };
  }

  const q: Record<string, unknown> = {
    content_type: "blogPost",
    limit: current.pageSize,
    skip: current.skip,
    include: 0,
    order: getSortOrder(current.sort),
    select: [
      "sys.id",
      "fields.title",
      "fields.description",
      "fields.slug",
      "fields.date",
      "fields.tags",
    ],
  };

  if (tagId) q["links_to_entry"] = tagId;

  const search = current.search?.trim();

  if (search) {
    q["fields.title[match]"] = search;
  }

  if (current.mode === "onlyPublished") {
    q["sys.publishedAt[exists]"] = true;
  } else if (current.mode === "onlyDrafts") {
    q["sys.publishedAt[exists]"] = false;
  }

  const page = await contentfulClient.getEntries<BlogPostSkeleton, "blogPost">(
    q
  );
  const items: PostListItem[] = await Promise.all(
    page.items.map(toPostListItem)
  );

  return { items, total: page.total, skip: page.skip, limit: page.limit };
}

export {
  contentfulClient,
  toPostListItem,
  getAllTagItems,
  getSortOrder,
  tagIdFromSlug,
  getPosts,
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
  SortOrder,
};

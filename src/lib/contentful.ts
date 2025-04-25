import type { PostListItem } from "@/types";
import * as contentful from "contentful";
import type { EntryFieldTypes, Entry, UnresolvedLink, Asset } from "contentful";

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
type AssetUnresolvedLink = UnresolvedLink<"Asset"> | Asset<undefined, string>;

export { contentfulClient };
export type {
  CodeBlockEntry,
  MermaidBlockEntry,
  BlogPost,
  TagItem,
  TagUnresolvedLink,
  AssetUnresolvedLink,
};

import * as contentful from "contentful";
import type { EntryFieldTypes, Entry } from "contentful";

const contentfulClient = contentful.createClient({
  space: import.meta.env.CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.DEV
    ? import.meta.env.CONTENTFUL_PREVIEW_TOKEN
    : import.meta.env.CONTENTFUL_DELIVERY_TOKEN,
  host: import.meta.env.DEV ? "preview.contentful.com" : "cdn.contentful.com",
});

interface BlogPost {
  contentTypeId: "blogPost";
  fields: {
    image: EntryFieldTypes.AssetLink;
    title: EntryFieldTypes.Text;
    description: EntryFieldTypes.Text;
    date: EntryFieldTypes.Date;
    content: EntryFieldTypes.RichText;
    slug: EntryFieldTypes.Text;
  };
}

interface CodeBlock {
  contentTypeId: "codeBlock";
  fields: {
    code: EntryFieldTypes.Text;
    language: EntryFieldTypes.Text;
  };
}

type CodeBlockEntry = Entry<CodeBlock>;

export { contentfulClient };
export type { CodeBlockEntry, BlogPost };

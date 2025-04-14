interface TOCItem {
  id: string;
  text: string;
  level: "h2" | "h3" | "h4" | "h5" | "h6";
}

export type { TOCItem };

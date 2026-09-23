import { getCollection, type CollectionEntry } from "astro:content";

export type DocEntry = CollectionEntry<"docs">;

/** Sidebar sections, in display order. The key is the content folder. */
export const sections = [
  { id: "getting-started", label: "Getting started" },
  { id: "styling", label: "Styling" },
  { id: "advanced", label: "Advanced" },
] as const;

export type SectionId = (typeof sections)[number]["id"];

export const sectionOf = (entry: DocEntry): SectionId => entry.id.split("/")[0] as SectionId;

/** Every page in reading order: section by section, then by `order`. */
export async function orderedDocs(): Promise<DocEntry[]> {
  const entries = await getCollection("docs");
  const rank = new Map(sections.map((s, i) => [s.id, i]));
  return entries.sort((a, b) => {
    const bySection = rank.get(sectionOf(a))! - rank.get(sectionOf(b))!;
    return bySection !== 0 ? bySection : a.data.order - b.data.order;
  });
}

export const hrefOf = (base: string, entry: DocEntry) => `${base}/docs/${entry.id}/`;

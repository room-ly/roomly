import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface GlossaryTerm {
  slug: string;
  term: string;
  reading?: string;
  category: GlossaryCategory;
  description: string;
  aliases?: string[];
  relatedSlugs?: string[];
  relatedColumns?: string[];
  lastModified?: string;
  content: string;
}

export type GlossaryCategory =
  | "contract"
  | "rent"
  | "moveout"
  | "maintenance"
  | "tenant"
  | "management"
  | "law";

export const GLOSSARY_CATEGORIES: { id: GlossaryCategory; label: string; description: string }[] = [
  { id: "contract", label: "契約・更新", description: "敷金・礼金・更新料・定期借家など賃貸契約まわりの用語" },
  { id: "rent", label: "家賃・滞納", description: "家賃保証・督促・代位弁済・明渡訴訟など家賃関連の用語" },
  { id: "moveout", label: "退去・原状回復", description: "原状回復義務・通常損耗・減価償却など退去時の用語" },
  { id: "maintenance", label: "修繕・設備", description: "善管注意義務・軽微な修繕・瑕疵担保など修繕関連の用語" },
  { id: "tenant", label: "入居者対応", description: "騒音・ペット可・楽器可など入居者まわりの用語" },
  { id: "management", label: "管理形態・委託", description: "自主管理・サブリース・PM・BMなど管理形態の用語" },
  { id: "law", label: "法令・制度", description: "宅建業法・借地借家法・賃貸住宅管理業法など制度の用語" },
];

const GLOSSARY_DIR = path.join(process.cwd(), "content", "glossary");

function collectMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...collectMdxFiles(path.join(dir, entry.name)));
    } else if (entry.name.endsWith(".mdx")) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function loadAllTerms(): GlossaryTerm[] {
  const files = collectMdxFiles(GLOSSARY_DIR);
  return files.map((filePath) => {
    const slug = path.basename(filePath).replace(/\.mdx$/, "");
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    return {
      slug,
      term: data.term || "",
      reading: data.reading || undefined,
      category: (data.category || "contract") as GlossaryCategory,
      description: data.description || "",
      aliases: data.aliases || undefined,
      relatedSlugs: data.relatedSlugs || undefined,
      relatedColumns: data.relatedColumns || undefined,
      lastModified: data.lastModified || undefined,
      content,
    };
  });
}

export function getAllTerms(): GlossaryTerm[] {
  return loadAllTerms().sort((a, b) =>
    (a.reading || a.term).localeCompare(b.reading || b.term, "ja")
  );
}

export function getTerm(slug: string): GlossaryTerm | undefined {
  return loadAllTerms().find((t) => t.slug === slug);
}

export function getAllSlugs(): string[] {
  return loadAllTerms().map((t) => t.slug);
}

export function getTermsByCategory(category: GlossaryCategory): GlossaryTerm[] {
  return getAllTerms().filter((t) => t.category === category);
}

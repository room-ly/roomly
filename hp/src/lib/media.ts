import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  lastModified?: string;
  category: string;
  tags: string[];
  content: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "column");

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

// 公開済みかどうか（dateが今日以前ならtrue）
function isPublished(date: string): boolean {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return new Date(date) <= today;
}

export function getAllArticles(): Article[] {
  const files = collectMdxFiles(CONTENT_DIR);
  const articles = files.map((filePath) => {
    const slug = path.basename(filePath).replace(/\.mdx$/, "");
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    return {
      slug,
      title: data.title || "",
      description: data.description || "",
      date: data.date || "",
      lastModified: data.lastModified || undefined,
      category: data.category || "",
      tags: data.tags || [],
      content,
    };
  });
  return articles
    .filter((a) => isPublished(a.date))
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export function getArticle(slug: string): Article | undefined {
  const files = collectMdxFiles(CONTENT_DIR);
  const filePath = files.find((f) => path.basename(f) === `${slug}.mdx`);
  if (!filePath) return undefined;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  if (!isPublished(data.date || "")) return undefined;
  return {
    slug,
    title: data.title || "",
    description: data.description || "",
    date: data.date || "",
    lastModified: data.lastModified || undefined,
    category: data.category || "",
    tags: data.tags || [],
    content,
  };
}

export function getAllSlugs(): string[] {
  return getAllArticles().map((a) => a.slug);
}

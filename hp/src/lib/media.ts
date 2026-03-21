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

// 公開済みかどうか（dateが今日以前ならtrue）
function isPublished(date: string): boolean {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return new Date(date) <= today;
}

export function getAllArticles(): Article[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
  const articles = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
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
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return undefined;
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

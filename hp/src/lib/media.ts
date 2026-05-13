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

function isPublished(date: string): boolean {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return new Date(date) <= today;
}

function loadAllArticles(): Article[] {
  const files = collectMdxFiles(CONTENT_DIR);
  return files.map((filePath) => {
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
}

// 公開済み記事のみ（一覧ページ・sitemap用）
export function getAllArticles(): Article[] {
  return loadAllArticles()
    .filter((a) => isPublished(a.date))
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export function getArticle(slug: string): Article | undefined {
  return loadAllArticles().find((a) => a.slug === slug);
}

// 全記事のslug（SSG用 — 未来記事もページ生成する）
export function getAllSlugs(): string[] {
  return loadAllArticles().map((a) => a.slug);
}

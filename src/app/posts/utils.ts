import fs from "fs";
import path from "path";
import { createHighlighter, makeSingletonHighlighter } from "shiki";
import { bundledLanguages } from "shiki/bundle/web";

type Metadata = {
  title: string;
  publishedAt: string;
  published?: string | boolean;
  summary: string;
  subtitle: string;
  author?: string;
  image?: string;
};

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  const frontMatterBlock = match![1];
  const content = fileContent.replace(frontmatterRegex, "").trim();
  const frontMatterLines = frontMatterBlock.trim().split("\n");
  const metadata: Partial<Record<keyof Metadata, string | boolean>> = {};

  frontMatterLines.forEach((line) => {
    if (!line.includes(":")) {
      return;
    }

    const [key, ...valueArr] = line.split(": ");
    const rawValue = valueArr.join(": ").trim();

    if (!rawValue) {
      return;
    }

    const value = rawValue.replace(/^['"](.*)['"]$/, "$1"); // Remove quotes
    metadata[key.trim() as keyof Metadata] =
      value === "true" ? true : value === "false" ? false : value;
  });

  return { metadata: metadata as Metadata, content };
}

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  return parseFrontmatter(rawContent);
}

function getMDXData(dir: string) {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));

    return {
      metadata,
      slug,
      content,
    };
  });
}

function isPublished(metadata: Metadata) {
  return metadata.published !== false && metadata.published !== "false";
}

export function getBlogPosts() {
  return getMDXData(path.join(process.cwd(), "src", "content"))
    .filter((post) => isPublished(post.metadata))
    .sort(
      (a, b) =>
        new Date(b.metadata.publishedAt).getTime() -
        new Date(a.metadata.publishedAt).getTime(),
    );
}

export function formatDate(date: string, includeRelative = false) {
  const currentDate = new Date();
  if (!date.includes("T")) {
    date = `${date}T00:00:00`;
  }
  const targetDate = new Date(date);

  const yearsAgo = currentDate.getFullYear() - targetDate.getFullYear();
  const monthsAgo = currentDate.getMonth() - targetDate.getMonth();
  const daysAgo = currentDate.getDate() - targetDate.getDate();

  let formattedDate = "";

  if (yearsAgo > 0) {
    formattedDate = `${yearsAgo}y ago`;
  } else if (monthsAgo > 0) {
    formattedDate = `${monthsAgo}mo ago`;
  } else if (daysAgo > 0) {
    formattedDate = `${daysAgo}d ago`;
  } else {
    formattedDate = "Today";
  }

  const fullDate = targetDate.toLocaleString("en-us", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (!includeRelative) {
    return fullDate;
  }

  return `${fullDate} (${formattedDate})`;
}

const getHighlighter = makeSingletonHighlighter(createHighlighter);

export const codeToHtml = async ({
  code,
  language,
}: {
  code: string;
  language: string;
}) => {
  const highlighter = await getHighlighter({
    themes: ["github-light", "github-dark"],
    langs: [...Object.keys(bundledLanguages)],
  });

  return highlighter.codeToHtml(code, {
    lang: language,
    themes: {
      dark: "github-dark",
      light: "github-light",
    },
  });
};

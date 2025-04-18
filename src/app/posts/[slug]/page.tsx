import { notFound } from "next/navigation";
import { formatDate, getBlogPosts } from "../utils";
import { baseUrl } from "@/app/sitemap";
import { CustomMDX } from "@/components/mdx";

export async function generateStaticParams() {
  const posts = getBlogPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);
  if (!post) {
    return null;
  }

  const {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata;
  const ogImage = image
    ? image
    : `${baseUrl}/og?title=${encodeURIComponent(title)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url: `${baseUrl}/blog/${post.slug}`,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <section>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${baseUrl}${post.metadata.image}`
              : `/og?title=${encodeURIComponent(post.metadata.title)}`,
            url: `${baseUrl}/blog/${post.slug}`,
            author: {
              "@type": "Person",
              name: "My Portfolio",
            },
          }),
        }}
      />

      <h1 className="mb-2 text-4xl leading-12">{post.metadata.title}</h1>
      {post.metadata.subtitle ? (
        <h2 className="mb-0 mt-0 text-lg opacity-75">
          {post.metadata.subtitle}
        </h2>
      ) : null}

      <p className="mb-0 pb-0">{post.metadata.author || "Bevan Wentzel"}</p>
      <p className="text-sm mt-0 pt-0 opacity-75">
        {formatDate(post.metadata.publishedAt)}
      </p>

      <hr className="w-full h-0.5 bg-white opacity-50 block mb-8 mt-6" />

      <article className="prose dark:prose-invert prose-lg">
        <CustomMDX source={post.content} />
      </article>
    </section>
  );
}

export const dynamicParams = false;

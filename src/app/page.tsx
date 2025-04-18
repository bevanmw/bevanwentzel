import Link from "next/link";
import { formatDate, getBlogPosts } from "./posts/utils";

export default function Home() {
  const posts = getBlogPosts();

  return (
    <div className="max-w-xl mx-auto px-4 dark:prose-invert md:my-24 w-full">
      <h1 className="text-center text-4xl">Bevan Wentzel</h1>
      <h2 className="text-center">
        Software developer, engineering leader at{" "}
        <a href="https://www.teamgeek.io" className="underline" target="_blank">
          Teamgeek
        </a>
      </h2>

      <div className="pt-8 md:pt-24">
        <h3 className="pb-4">Recent posts</h3>

        <ul>
          {posts.map((post) => (
            <li key={post.slug}>
              <Link className="block pb-4" href={`/posts/${post.slug}`}>
                <h4 className="underline">{post.metadata.title}</h4>
                <p className="opacity-75">
                  {formatDate(post.metadata.publishedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

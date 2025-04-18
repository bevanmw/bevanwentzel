export function Article({
  title,
  subtitle,
  date,
  author = "Bevan Wentzel",
  children,
}: {
  title: string;
  date: string;
  author?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="prose max-w-xl mx-auto px-4 dark:prose-invert prose-lg">
      <h1 className="mb-2 leading-16">{title}</h1>
      {subtitle ? (
        <h2 className="mb-0 mt-0 text-lg opacity-75">{subtitle}</h2>
      ) : null}

      <p className="mb-0 pb-0">{author}</p>
      <p className="text-sm mt-0 pt-0 opacity-75">{date}</p>

      <hr className="mt-0 w-full h-0.5 bg-white opacity-75 block" />

      {children}
    </article>
  );
}

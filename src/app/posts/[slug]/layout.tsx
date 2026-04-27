export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <article className="max-w-3xl mx-auto px-4 w-full">{children}</article>
  );
}

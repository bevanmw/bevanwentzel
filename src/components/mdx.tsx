import Link from "next/link";
import Image, { ImageProps } from "next/image";
import { MDXRemote, MDXRemoteProps } from "next-mdx-remote/rsc";
import React from "react";
import { codeToHtml } from "@/app/posts/utils";
import { MermaidDiagram } from "@/components/mermaid-diagram";

function Table({
  data,
}: {
  data: { headers: React.ReactNode[]; rows: React.ReactNode[][] };
}) {
  const headers = data.headers.map((header, index) => (
    <th key={index}>{header}</th>
  ));
  const rows = data.rows.map((row, index) => (
    <tr key={index}>
      {row.map((cell, cellIndex) => (
        <td key={cellIndex}>{cell}</td>
      ))}
    </tr>
  ));

  return (
    <table>
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

function CustomLink(props: { href: string; children: React.ReactNode }) {
  const { href, ...otherProps } = props;

  if (href.toString().startsWith("/")) {
    return (
      <Link href={href} {...otherProps}>
        {props.children}
      </Link>
    );
  }

  if (href.startsWith("#")) {
    return <a {...props} />;
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
}

function RoundedImage(props: ImageProps) {
  return <Image className="rounded-lg" {...props} alt={props.alt} />;
}

function slugify(str: string) {
  return str
    .toString()
    .toLowerCase()
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters except for -
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

function createHeading(level: number) {
  const Heading = ({ children }: { children: string }) => {
    const slug = slugify(children);
    return React.createElement(
      `h${level}`,
      { id: slug },
      [
        React.createElement("a", {
          href: `#${slug}`,
          key: `link-${slug}`,
          className: "anchor",
        }),
      ],
      children,
    );
  };

  Heading.displayName = `Heading${level}`;

  return Heading;
}

function Super({ children }: { children: React.ReactNode }) {
  return <sup>{children}</sup>;
}

function Pre(props: React.HTMLAttributes<HTMLPreElement>) {
  const child = React.Children.only(props.children);

  if (
    React.isValidElement<{ className?: string }>(child) &&
    child.props.className === "language-mermaid"
  ) {
    return child;
  }

  return <pre {...props} />;
}

async function Code({
  className,
  children,
}: {
  className?: string;
  children: string;
}) {
  if (className === "language-mermaid") {
    return <MermaidDiagram chart={children.trim()} />;
  }

  if (!className) {
    return <code>{children}</code>;
  }

  const html = await codeToHtml({
    code: children,
    language: className.replace("language-", ""),
  });
  return (
    <code className="not-prose" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  pre: Pre,
  code: Code,
  sup: Super,
  Image: RoundedImage,
  a: CustomLink,
  Table,
};

export function CustomMDX(props: MDXRemoteProps) {
  return (
    <MDXRemote
      {...props}
      components={{ ...components, ...(props.components || {}) }}
    />
  );
}

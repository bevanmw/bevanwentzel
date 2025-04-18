import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Geist_Mono,
  Libre_Baskerville,
} from "next/font/google";
import "./globals.css";
import Link from "next/link";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "300", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const libre = Libre_Baskerville({
  variable: "--font-libre",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Bevan Wentzel Dev Blog",
  description: "Just my thoughts navigating the world of tech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${geistMono.variable} ${libre.variable} antialiased`}
      >
        <nav className="flex justify-between mx-auto max-w-xl py-6 pb-8 px-4 w-full">
          <Link href="/">
            <p className="text-lg font-bold font-(family-name:--font-libre)">
              Bevan Wentzel
            </p>
          </Link>
          <div className="flex gap-2">
            <a href="https://www.linkedin.com/in/bevanmw/" target="_blank">
              <svg
                width="24"
                height="24"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid"
                viewBox="0 0 256 256"
              >
                <path
                  d="M218.123 218.127h-37.931v-59.403c0-14.165-.253-32.4-19.728-32.4-19.756 0-22.779 15.434-22.779 31.369v60.43h-37.93V95.967h36.413v16.694h.51a39.907 39.907 0 0 1 35.928-19.733c38.445 0 45.533 25.288 45.533 58.186l-.016 67.013ZM56.955 79.27c-12.157.002-22.014-9.852-22.016-22.009-.002-12.157 9.851-22.014 22.008-22.016 12.157-.003 22.014 9.851 22.016 22.008A22.013 22.013 0 0 1 56.955 79.27m18.966 138.858H37.95V95.967h37.97v122.16ZM237.033.018H18.89C8.58-.098.125 8.161-.001 18.471v219.053c.122 10.315 8.576 18.582 18.89 18.474h218.144c10.336.128 18.823-8.139 18.966-18.474V18.454c-.147-10.33-8.635-18.588-18.966-18.453"
                  fill="currentColor"
                />
              </svg>
            </a>
          </div>
        </nav>
        {children}

        <footer className="pt-10 pb-8">
          <p className="opacity-75 text-center">
            <a href="mailto:hello@bevanwentzel.com" className="underline">
              hello@bevanwentzel.com
            </a>
          </p>
          <p className="opacity-75 text-center">
            Copyright © {new Date().getFullYear()} - Bevan Wentzel
          </p>
        </footer>
      </body>
    </html>
  );
}

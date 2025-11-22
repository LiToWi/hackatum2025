// app/not-found.tsx

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center text-center p-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">404 – Page Not Found</h1>
        <p className="text-lg mb-6">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.<br />
          But we would love to help you find a home 😊
        </p>
        <Link href="/" className="text-gradient-pink-purple-with-underline">Go find a home</Link>
      </div>
    </div>
  );
}

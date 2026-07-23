"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RedirectPage() {
  const params = useParams();
  const code = params?.code;
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;

    // Check localStorage for the mock link
    const stored = localStorage.getItem("mock_links");
    if (stored) {
      try {
        const mappings = JSON.parse(stored);
        const longUrl = mappings[code as string];
        if (longUrl) {
          // Perform the redirect!
          window.location.href = longUrl;
          return;
        }
      } catch (e) {
        console.error("Failed to parse mock links", e);
      }
    }

    // If not found in localStorage, redirect to landing page
    setError("Mock link not found. Redirecting to home page...");
    const timer = setTimeout(() => {
      router.replace("/");
    }, 2000);

    return () => clearTimeout(timer);
  }, [code, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="text-center space-y-4">
        {error ? (
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">{error}</p>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">Redirecting you to your destination...</p>
          </>
        )}
      </div>
    </div>
  );
}

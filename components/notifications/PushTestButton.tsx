"use client";

import { useState } from "react";

export default function PushTestButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const sendTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Whispera",
          body: "Test notification",
          url: "/(root)/chats",
          icon: "/favicon.ico"
        })
      });
      const data = await res.json();
      setResult(JSON.stringify(data));
    } catch (e: any) {
      setResult("Error: " + e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={sendTest} disabled={loading} className="rounded bg-blue-600 px-3 py-1 text-white">
      {loading ? "Sending..." : "Send test push"}
    </button>
  );
}

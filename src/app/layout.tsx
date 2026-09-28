import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Memory Engineer — AI Engineering Incident Intelligence",
  description: "AI engineering incident intelligence powered by Hindsight Cloud semantic memory and Groq LLM reasoning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

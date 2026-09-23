import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Certificate Studio - Professional Certificate Design & Batch Personalization",
  description: "Create certificates from scratch or upload existing templates. Auto-fit long and Unicode recipient names, batch personalize thousands of documents, and export print-ready PDFs and ZIP packages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased flex flex-col md:flex-row">
        <ToastProvider>
          <Navbar />
          <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 min-h-screen">
            <div className="flex-1">{children}</div>
            <footer className="border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500 bg-slate-900/50">
              Certificate Studio generates documents from templates supplied or created by the user. Users are responsible for ensuring they have the rights to use uploaded artwork, logos, signatures, fonts, and certificate content.
            </footer>
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}

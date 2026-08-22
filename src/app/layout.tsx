import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Queridômetro",
  description: "O queridômetro da turma. Uma rodada por semana.",
};

export const viewport: Viewport = {
  themeColor: "#0a0616",
  // Impede o zoom por duplo-toque, que atrapalha o tap rápido nos emojis.
  maximumScale: 1,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}

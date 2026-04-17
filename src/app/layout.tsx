import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GenDoc — Générez et modifiez vos documents en quelques clics",
  description:
    "La plateforme tout-en-un pour générer des documents officiels et modifier vos PDF. Certificats, contrats, attestations : simple, rapide, professionnel.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

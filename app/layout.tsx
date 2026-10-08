import type { Metadata } from "next";
import "../assets/css/style.css";

export const metadata: Metadata = {
  title: "FoodGuard | Food Spoilage Detection System",
  description: "Live food spoilage monitoring dashboard.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
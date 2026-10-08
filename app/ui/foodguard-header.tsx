"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M16 27c-6.1 0-10.5-4.1-10.5-10.2C5.5 10.5 10 5.4 18.8 5c.5 8.2-1.6 12-6.5 12.9 2.3.2 4.5-.5 6.5-2.4 1.1-1 2-2.3 2.8-3.9C24.5 22 21.4 27 16 27Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M10 24c1.1-3.1 3.4-5.7 6.8-7.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>;
}

export function FoodGuardHeader({ meta }: { meta?: ReactNode }) {
  const pathname = usePathname();

  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="FoodGuard dashboard"><BrandMark /><span className="brand-copy"><strong>FoodGuard</strong><small>Food Spoilage Detection System</small></span></Link>
      <nav className="primary-nav" aria-label="Main navigation">
        <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>Dashboard</Link>
        <Link href="/ai-prediction" aria-current={pathname === "/ai-prediction" ? "page" : undefined}>AI Prediction</Link>
      </nav>
      {meta}
    </header>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "대시보드" },
  { href: "/search", label: "원료·품목 검색" },
  { href: "/companies", label: "업체 분석" },
  { href: "/categories", label: "기능성 분류" },
];

export default function NavTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium tracking-[0.4px] transition-colors ${
              active ? "bg-primary text-on-primary" : "text-on-dark hover:bg-white/10"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

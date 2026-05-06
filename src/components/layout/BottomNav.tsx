"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Baby, Building2, Home, ShoppingCart, Users, UtensilsCrossed } from "lucide-react";

const items = [
  { href: "/", label: "בית", icon: Home },
  { href: "/baby", label: "תינוקת", icon: Baby },
  { href: "/kids-tracking", label: "ילדים", icon: Users },
  { href: "/kids-meals", label: "ארוחות", icon: UtensilsCrossed },
  { href: "/studio", label: "אולפן", icon: Building2 },
  { href: "/shopping", label: "קניות", icon: ShoppingCart },
  { href: "/health", label: "בריאות", icon: Activity },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-sage-200/70 bg-white/90 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 shadow-[0_-8px_30px_rgba(60,80,60,0.08)] backdrop-blur-md"
      aria-label="ניווט ראשי"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="relative flex min-w-[3.25rem] flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[9px] font-semibold leading-tight text-sage-800 sm:min-w-0 sm:gap-1 sm:rounded-2xl sm:py-2 sm:text-[10px] md:text-xs"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl bg-sage-100/90 shadow-inner ring-1 ring-sage-200/80"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex flex-col items-center gap-1">
                <Icon
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    active ? "text-sage-800" : "text-sage-500"
                  }`}
                  aria-hidden
                />
                <span className={active ? "text-sage-950" : "text-sage-600"}>
                  {label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

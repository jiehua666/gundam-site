"use client";

import { Navbar, Footer, BottomTab } from "@/components/layout";
import MobileNav from "@/components/layout/MobileNav";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <MobileNav />
      <main className="flex-1 pt-16 md:pt-16 pb-20 md:pb-0">{children}</main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomTab />
    </>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Layers, 
  PlusCircle, 
  PlayCircle, 
  History, 
  ShieldCheck, 
  Settings,
  Award,
  Sparkles
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Templates", href: "/templates", icon: Layers },
    { label: "Create Certificate", href: "/editor", icon: PlusCircle },
    { label: "Generate Batch", href: "/generate", icon: PlayCircle },
    { label: "History", href: "/history", icon: History },
    { label: "Verification", href: "/verify", icon: ShieldCheck },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 z-40 select-none">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Certificate Studio
            </h1>
            <p className="text-[11px] text-indigo-400 font-medium tracking-wide uppercase">
              Pro Document Suite
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Pro Badge Card */}
        <div className="p-4 m-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-900/40">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> High-DPI Engine
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Deterministic WYSIWYG rendering with TrueType & Bangla font support.
          </p>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
          Certificate Studio v1.0.0
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around px-2 py-2">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium transition-colors ${
                isActive ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

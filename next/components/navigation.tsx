"use client";
import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
export function Navigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menu = useRef<HTMLButtonElement>(null);
  return (
    <header
      className="nav wrap"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          menu.current?.focus();
        }
      }}
    >
      <Brand />
      <nav
        aria-label="Main navigation"
        className={open ? "nav-links is-open" : "nav-links"}
        id="main-nav"
      >
        <a
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          Overview
        </a>
        <a
          href="/workbench"
          aria-current={pathname === "/workbench" ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          Workbench
        </a>
        <a href="/#science" onClick={() => setOpen(false)}>
          The science
        </a>
      </nav>
      <div className="nav-actions">
        <ThemeToggle />
        <a
          className="button button-outline nav-project"
          href="https://github.com/wrestle-R/Honours-project"
          target="_blank"
          rel="noreferrer"
        >
          View project <ArrowUpRight size={16} />
        </a>
        <button
          className="menu-button"
          ref={menu}
          aria-controls="main-nav"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

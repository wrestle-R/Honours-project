"use client";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
export function Navigation() {
  const [open, setOpen] = useState(false);
  return (
    <header className="nav wrap">
      <Brand />
      <nav
        aria-label="Main navigation"
        className={open ? "nav-links is-open" : "nav-links"}
        id="main-nav"
      >
        <a href="#workbench" onClick={() => setOpen(false)}>
          The workbench
        </a>
        <a href="#science" onClick={() => setOpen(false)}>
          The science
        </a>
        <a href="#about" onClick={() => setOpen(false)}>
          About
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

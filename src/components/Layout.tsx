import { Mail, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { CustomCursor } from "./CustomCursor";
import { GlobalMusicPlayer, MusicProvider } from "./MusicPlayer";
import { AskPortfolioChat } from "./interactive/AskPortfolioChat";

const links = [
  { to: "/", label: "Home" },
  { to: "/projects", label: "Projects" },
  { to: "/experiences", label: "Experiences" },
  { to: "/lead-self", label: "Lead Self" },
  { to: "/articles", label: "Articles" },
  { to: "/resume", label: "Resume" },
  { to: "/systems", label: "Systems" },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    try {
      if (window.self !== window.top) {
        document.documentElement.classList.add("is-embedded");
        document.body.classList.add("is-embedded");
      }
    } catch {
      document.documentElement.classList.add("is-embedded");
      document.body.classList.add("is-embedded");
    }
  }, []);

  useEffect(() => {
    if (location.hash) {
      window.setTimeout(() => {
        document.querySelector(location.hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const revealSelector = "[data-reveal], section, .card";
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.08 },
    );

    const observed = new Set<Element>();
    const observeElements = (root: ParentNode = document) => {
      root.querySelectorAll(revealSelector).forEach((element) => {
        if (observed.has(element)) return;
        observed.add(element);
        observer.observe(element);
      });
    };

    observeElements();

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(revealSelector) && !observed.has(node)) {
            observed.add(node);
            observer.observe(node);
          }
          observeElements(node);
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [location.pathname]);

  return (
    <MusicProvider>
      <CustomCursor />
      <header className="site-nav">
        <div className="nav-inner">
          <Link className="brand" to="/" onClick={() => setOpen(false)}>
            <span className="brand-dot" />
            <span>Oktavianus Samuel</span>
          </Link>
          <button className="nav-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <nav className={`nav-links ${open ? "nav-links-open" : ""}`}>
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
                {link.label}
              </NavLink>
            ))}
            <NavLink className="nav-contact" to="/contact" onClick={() => setOpen(false)}>
              <Mail size={15} /> Contact
            </NavLink>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      {isAdmin ? null : (
        <>
          <AskPortfolioChat />
          <GlobalMusicPlayer />
          <footer className="site-footer">
            <div className="container footer-inner">
              <span>Built with reflection, structure, and purpose.</span>
              <span>Still improving, one system at a time.</span>
            </div>
          </footer>
        </>
      )}
    </MusicProvider>
  );
}

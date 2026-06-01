import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { CustomCursor } from "./CustomCursor";
import { MusicPlayer } from "./MusicPlayer";

const links = [
  { to: "/", label: "Home" },
  { to: "/projects", label: "Projects" },
  { to: "/experiences", label: "Experiences" },
  { to: "/lead-self", label: "Lead Self" },
  { to: "/resume", label: "Resume" },
  { to: "/systems", label: "Systems" },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

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
    const elements = document.querySelectorAll("[data-reveal], section, .card");
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

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [location.pathname]);

  return (
    <>
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
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <MusicPlayer />
      <footer className="site-footer">
        <div className="container footer-inner">
          <span>Built with reflection, structure, and purpose.</span>
          <span>Still improving, one system at a time.</span>
        </div>
      </footer>
    </>
  );
}

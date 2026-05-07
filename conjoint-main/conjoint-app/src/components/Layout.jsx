import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Layout({ children }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItem = (path, label) => {
    const active = location.pathname === path;

    return (
      <Link
        to={path}
        onClick={() => setMenuOpen(false)}
        className={`block rounded-lg px-4 py-2 text-sm font-medium transition ${
          active
            ? "bg-gray-800 text-white"
            : "text-gray-300 hover:bg-gray-800 hover:text-white"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 border-b border-slate-800 bg-gray-900 px-4 py-3 shadow-sm md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-white md:text-xl">
              Conjoint Lab
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 bg-gray-800 text-white transition hover:bg-gray-700"
          >
            <span className="sr-only">Open navigation</span>
            <div className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </div>
          </button>
        </div>

        {menuOpen ? (
          <div className="absolute right-4 top-[calc(100%-0.25rem)] mt-3 w-64 rounded-2xl border border-slate-700 bg-gray-900 p-3 shadow-2xl md:right-6">
            <nav className="space-y-2">
              {navItem("/", "Dashboard")}
              {navItem("/analysis-dashboard", "Analysis Dashboard")}
              {navItem("/create", "Create Survey")}
            </nav>
          </div>
        ) : null}
      </div>

      <div
        className={`flex-1 p-4 md:p-6 ${
          location.pathname === "/analysis-dashboard" ? "xl:overflow-hidden xl:p-5" : "xl:p-10"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default Layout;

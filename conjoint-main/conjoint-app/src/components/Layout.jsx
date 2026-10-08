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
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <div className="relative z-40 shrink-0 border-b border-slate-800 bg-gray-900 px-4 py-2 shadow-sm md:px-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-white md:text-lg">
              Conjoint Lab
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-gray-800 text-white transition hover:bg-gray-700"
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
          <div className="absolute right-4 top-full mt-3 w-64 rounded-2xl border border-slate-700 bg-gray-900 p-3 shadow-2xl md:right-6">
            <nav className="space-y-2">
              {navItem("/", "Dashboard")}
              {navItem("/analysis-dashboard", "Analysis Dashboard")}
              {navItem("/create", "Create Survey")}
            </nav>
          </div>
        ) : null}
      </div>

      <div
        className={`min-h-0 flex-1 p-3 md:p-4 ${
          location.pathname === "/analysis-dashboard" ? "overflow-y-auto xl:p-6" : "overflow-y-auto xl:p-8"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default Layout;

import { Link, useLocation } from "react-router-dom";

function Layout({ children }) {
  const location = useLocation();

  const navItem = (path, label) => {
    const active = location.pathname === path;

    return (
      <Link
        to={path}
        className={`block px-4 py-2 rounded-lg text-sm font-medium transition ${
          active
            ? "bg-gray-800 text-white"
            : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 p-6">
        <h1 className="text-white text-xl font-semibold mb-10">
          Conjoint Lab
        </h1>

        <nav className="space-y-2">
          {navItem("/", "Dashboard")}
          {navItem("/create", "Create Survey")}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10">
        {children}
      </div>
    </div>
  );
}

export default Layout;
import { NavLink } from "react-router-dom";

const links = [
  { to: "/progress", label: "Progress" },
  { to: "/log", label: "Log Activity" },
  { to: "/activities", label: "Activities" },
  { to: "/rewards", label: "Rewards" },
];

export default function Navbar() {
  return (
    <nav className="bg-brand-700 text-white shadow-md">
      <div className="container mx-auto px-4 max-w-4xl flex items-center justify-between h-14">
        <span className="font-bold text-lg tracking-tight">A Bettr Me</span>
        <ul className="flex gap-1">
          {links.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white text-brand-700"
                      : "text-white hover:bg-brand-600"
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

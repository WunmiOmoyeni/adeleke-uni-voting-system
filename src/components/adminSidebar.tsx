"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AdminSidebar = () => {
  const pathname = usePathname();

  const links = [
    { href: "/admin-dashboard", label: "🏠 Dashboard" },
    { href: "/admin-dashboard/manage-candidates", label: "👤 Manage Candidates" },
    { href: "/admin-dashboard/registered-voters", label: "🗳️ Registered Voters" },
    { href: "/admin-dashboard/view-results", label: "📊 View Results" },
    { href: "/admin-dashboard/settings", label: "⚙️ Settings" },
  ];

  return (
    <aside className="w-full sm:w-64 bg-blue-600 text-white p-5 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
      <nav>
        <ul className="space-y-4">
          {links.map((link) => (
            <li key={link.href} className={`p-2 rounded ${pathname === link.href ? "bg-blue-700" : "hover:bg-blue-700"}`}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;

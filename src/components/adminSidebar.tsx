"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const AdminSidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/admin-dashboard", label: "🏠 Dashboard" },
    { href: "/admin-dashboard/manage-candidates", label: "👤 Manage Candidates" },
    { href: "/admin-dashboard/registered-voters", label: "🗳️ Registered Voters" },
    { href: "/admin-dashboard/view-results", label: "📊 View Results" },
    { href: "/admin-dashboard/settings", label: "⚙️ Settings" },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile Toggle Button - Always visible on small screens */}
      <button 
        onClick={toggleSidebar}
        className="fixed top-4 left-1 z-50 p-2 bg-blue-600 text-white rounded-md sm:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - Hidden on mobile unless toggled, always visible on sm and up */}
      <aside 
        className={`fixed top-0 left-0 z-40 w-64 bg-blue-600 text-white p-5 h-auto transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        } sm:relative sm:block`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          {/* <button 
            onClick={toggleSidebar} 
            className="text-white sm:hidden"
            aria-label="Close menu"
          >
            <X size={24} />
          </button> */}
        </div>
        <nav>
          <ul className="space-y-4">
            {links.map((link) => (
              <li 
                key={link.href} 
                className={`p-2 rounded ${
                  pathname === link.href ? "bg-blue-700" : "hover:bg-blue-700"
                } transition-colors duration-200`}
              >
                <Link 
                  href={link.href}
                  className="block w-full"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      
      {/* Overlay for mobile - only appears when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 sm:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default AdminSidebar;
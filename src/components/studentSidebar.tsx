"use client";
import Link from "next/link";
import { useState } from "react";

const StudentSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="sm:hidden p-4 text-white bg-blue-500 rounded-full absolute top-4 right-4 z-20"
      >
        <span className="block w-6 h-1 bg-white mb-2"></span>
        <span className="block w-6 h-1 bg-white mb-2"></span>
        <span className="block w-6 h-1 bg-white"></span>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed sm:relative left-0 top-0 bg-blue-600 text-white w-64 p-5 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } sm:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <h2 className="text-2xl font-bold mb-6">Student Dashboard</h2>
        <nav>
          <ul className="space-y-4">
            <li className="hover:bg-blue-700 p-2 rounded">
              <Link href="/student-dashboard">🏠 Dashboard</Link>
            </li>
            <li className="hover:bg-blue-700 p-2 rounded">
              <Link href="/student-dashboard/vote">🗳️ Vote</Link>
            </li>
            <li className="hover:bg-blue-700 p-2 rounded">
              <Link href="/student-dashboard/results">📊 Election Results</Link>
            </li>
            <li className="hover:bg-blue-700 p-2 rounded">
              <Link href="/student-dashboard/profile">👤 Profile</Link>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default StudentSidebar;

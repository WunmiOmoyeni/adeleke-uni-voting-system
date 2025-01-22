"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import LogoutModal from "@/components/logoutModal"; // Import the modal

const StudentDashboard = () => {
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error("Logout error: ", error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-[OpenSans-Bold]">Student Dashboard</h1>
            <button onClick={() => setShowLogoutModal(true)} className="bg-red-500 px-4 py-2 text-white rounded">
                Logout
            </button>

            {/* Logout Modal */}
            <LogoutModal
                isOpen={showLogoutModal}
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutModal(false)}
            />
        </div>
    );
};

export default StudentDashboard;

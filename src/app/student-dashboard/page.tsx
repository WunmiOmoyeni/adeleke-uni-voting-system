"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, firestore } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import LogoutModal from "@/components/logoutModal"; // Import the modal
import StudentSidebar from "@/components/studentSidebar";

const StudentDashboard = () => {
  const [student, setStudent] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    matricNumber: string;
    faculty: string;
    department: string;
    level: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [election, setElection] = useState<{
    status: string;
    startDate: string;
    endDate: string;
  } | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchStudentData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const studentRef = doc(firestore, "students", user.uid);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        setStudent(studentSnap.data() as any);
      } else {
        console.error("No student data found!");
      }

      setLoading(false);
    };

    fetchStudentData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error: ", error);
    }
  };

  useEffect(() => {
    const fetchElectionData = async () => {
      const electionRef = doc(firestore, "election", "status");
      const electionSnap = await getDoc(electionRef);

      if (electionSnap.exists()) {
        setElection(electionSnap.data() as any);
      } else {
        console.error("No election data found!");
      }
    };

    fetchElectionData();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <StudentSidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        {loading ? (
          <p className="text-center text-lg">Loading...</p>
        ) : (
          <>
            {/* Header Section */}
            <div className=" p-3 flex justify-between items-center">
              <h1 className="text-2xl font-bold">
                Welcome, {student?.firstName} {student?.lastName} 👋
              </h1>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="bg-yellow-500 px-4 py-2 text-white rounded-lg shadow-md"
              >
                Logout
              </button>
            </div>

            {/* Student Details */}
            <div className="mt-6 bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold">📚 Student Information</h2>
              <p className="text-gray-700 mt-2">
                <span className="font-medium">Matric Number:</span>{" "}
                {student?.matricNumber} <br />
                <span className="font-medium">Faculty:</span> {student?.faculty}{" "}
                <br />
                <span className="font-medium">Department:</span>{" "}
                {student?.department} <br />
                <span className="font-medium">Level:</span> {student?.level}
              </p>
            </div>

            {/* Election Details */}
            {election && (
              <div className="mt-6 bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-xl font-semibold">
                  🗳️ Election Information
                </h2>
                <p className="text-gray-700 mt-2">
                  <span className="font-medium">Status:</span> {election.status}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Voting Period:</span>{" "}
                  {election.startDate} - {election.endDate}
                </p>
              </div>
            )}

            {/* Logout Confirmation Modal */}
            <LogoutModal
              isOpen={showLogoutModal}
              onConfirm={handleLogout}
              onCancel={() => setShowLogoutModal(false)}
            />
          </>
        )}
      </div>
    </div>
  );};

export default StudentDashboard;

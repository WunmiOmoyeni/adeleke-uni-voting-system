"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, firestore } from "../../../../firebaseConfig";
import { doc, getDoc, Timestamp, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import LogoutModal from "@/components/logoutModal";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";
import auLogo from "../../../images/au.png";
import Image from "next/image";

interface Student {
  firstName: string;
  lastName: string;
  email: string;
  matricNumber: string;
  faculty: string;
  department: string;
  level: string;
}

interface Election {
  status: string;
  startDate: string;
  endDate: string;
  title: string;
  description: string;
  instructions: string;
  resultsVisibility: string;
  candidateDeadline: string;
  lastUpdated: Timestamp;
}
const StudentDashboard = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [election, setElection] = useState<Election | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [listeners, setListeners] =  useState<(() => void)[]>([]);
  const router = useRouter();
  
  const addListener = (unsubscribeFunc: () => void) => {
    setListeners(prev => [...prev, unsubscribeFunc]);
  };

  // Get time of day for personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const studentRef = doc(firestore, "students", user.uid);
          const studentSnap = await getDoc(studentRef);

          if (studentSnap.exists()) {
            setStudent(studentSnap.data() as Student);
            setStudentId(user.uid);
          } else {
            console.warn("No student data found for user:", user.uid);
          }
        } catch (error) {
          console.error("Error fetching student data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        router.push("/login");
      }
    });

    addListener(unsubscribe);

    // Cleanup subscription
    return () => unsubscribe();
  }, [router]);

  // Check if student has voted
  useEffect(() => {
    const checkVotingStatus = async () => {
      if (!studentId) return;
      
      try {
        // Convert from one-time query to a listener
        const votesQuery = query(
          collection(firestore, "votes"),
          where("studentId", "==", studentId),
          where("submitted", "==", true)
        );
        
        const unsubscribeVotes = onSnapshot(votesQuery, (snapshot) => {
          setHasVoted(!snapshot.empty);
        }, (error) => {
          console.error("Error checking voting status:", error);
        });
        
        // Add this listener to our cleanup array
        addListener(unsubscribeVotes);
        
      } catch (error) {
        console.error("Error setting up voting status listener:", error);
      }
    };
    
    checkVotingStatus();
  }, [studentId]);

  const handleLogout = async () => {
    setShowLogoutModal(false);

    // Unsubscribe from all listeners before signing out
    listeners.forEach(unsubscribe => unsubscribe());
    setListeners([]);

    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error: ", error);
    }
  };

  useEffect(() => {
    const fetchElectionData = async () => {
      try {
        // Convert from one-time getDoc to a listener with onSnapshot
        const electionRef = doc(firestore, "election", "status");
        
        const unsubscribeElection = onSnapshot(electionRef, (doc) => {
          if (doc.exists()) {
            setElection(doc.data() as Election);
          } else {
            console.error("No election data found!");
          }
        }, (error) => {
          console.error("Error getting election updates:", error);
        });
        
        // Add this listener to our cleanup array
        addListener(unsubscribeElection);
        
      } catch (error) {
        console.error("Error setting up election listener:", error);
      }
    };

    fetchElectionData();
  }, []);

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-500";
      case "upcoming":
        return "bg-yellow-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar
      <StudentSidebar /> */}

      {/* Main Content */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
          </div>
        ) : (
          <>
            {/* Hero Banner Section - Updated with Yellow and Royal Blue */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-blue-800 rounded-xl p-4 md:p-6 mb-6 text-white shadow-lg">
              {/* Top Section on Mobile, Left on Desktop: Logo and Profile */}
              <div className="flex w-full md:w-auto justify-between items-center mb-4 md:mb-0">
                <Image
                  src={auLogo}
                  alt="logo"
                  className="w-10 h-10 md:w-12 md:h-12"
                />

                {/* Profile Icon - Only visible on mobile */}
                <div className="bg-white/20 p-3 rounded-full md:hidden">
                  <span className="text-xl">👤</span>
                </div>
              </div>

              {/* Middle Section: Greeting */}
              <div className="flex flex-col text-center mb-4 md:mb-0">
                <span className="text-xs md:text-sm font-medium bg-white/20 px-2 py-1 md:px-3 md:py-1 rounded-full">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <h1 className="text-xl md:text-3xl font-bold mt-2">
                  {getGreeting()}, {student?.firstName} 👋
                </h1>
              </div>

              {/* Bottom Section on Mobile, Right on Desktop: Profile and Logout */}
              <div className="flex items-center gap-2 md:gap-4">
                {/* Profile Icon - Only visible on desktop */}
                <div className="hidden md:flex bg-white/20 p-4 rounded-full">
                  <span className="text-2xl">👤</span>
                </div>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 transition-all px-4 py-2 text-white rounded-lg"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Details Card - Updated Colors */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden transition-all hover:shadow-xl">
                <div className="bg-blue-800 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <span className="mr-2">📚</span> Student Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-b pb-2">
                      <p className="text-sm text-gray-500">Matric Number</p>
                      <p className="font-medium">{student?.matricNumber}</p>
                    </div>
                    <div className="border-b pb-2">
                      <p className="text-sm text-gray-500">Faculty</p>
                      <p className="font-medium">{student?.faculty}</p>
                    </div>
                    <div className="border-b pb-2">
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="font-medium">{student?.department}</p>
                    </div>
                    <div className="border-b pb-2">
                      <p className="text-sm text-gray-500">Level</p>
                      <p className="font-medium">{student?.level}</p>
                    </div>
                    <div className="col-span-2 border-b pb-2">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{student?.email}</p>
                    </div>
                  </div>
                  <button className="mt-4 text-blue-800 hover:text-blue-900 text-sm font-medium flex items-center">
                    Update Profile <span className="ml-1">→</span>
                  </button>
                </div>
              </div>

              {/* Election Details Card - Updated Colors */}
              {election && (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden transition-all hover:shadow-xl">
                  <div className="bg-blue-800 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <span className="mr-2">🗳️</span>{" "}
                      {election.title || "Election Information"}
                    </h2>
                    <span
                      className={`${getStatusColor(
                        election.status
                      )} px-3 py-1 rounded-full text-xs text-white font-medium`}
                    >
                      {election.status}
                    </span>
                  </div>
                  <div className="p-6">
                    {election.description && (
                      <div className="mb-4 bg-yellow-50 p-3 rounded-lg">
                        <p className="font-[OpenSans-Medium] text-sm text-gray-700">
                          {election.description}
                        </p>
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className="font-[OpenSans-Medium] text-lg">
                        Voting Period
                      </h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="bg-gray-100 p-2 rounded text-center flex-1">
                          <p className="text-sm text-gray-500">Start Date</p>
                          <p className="font-[OpenSans-Medium]">
                            {formatDate(election.startDate)}
                          </p>
                        </div>
                        <div className="bg-gray-100 p-2 rounded text-center flex-1">
                          <p className="text-sm text-gray-500">End Date</p>
                          <p className="font-[OpenSans-Medium]">
                            {formatDate(election.endDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {election.candidateDeadline && (
                      <div className="mt-10 mb-4">
                        <h3 className="font-[OpenSans-Medium] text-lg">
                          Candidate Registration Deadline
                        </h3>
                        <p className="bg-yellow-100 px-3 py-4 rounded-lg mt-1 font-[OpenSans-Medium]">
                          {formatDate(election.candidateDeadline)}
                        </p>
                      </div>
                    )}

                    {/* Voting Instructions */}
                    {election.instructions && (
                      <div className="mt-5 mb-4">
                        <h3 className="font-[OpenSans-Medium] text-lg flex items-center">
                          <span className="mr-1">📝</span> Voting Instructions
                        </h3>
                        <div className="bg-blue-50 p-3 rounded-lg mt-2 text-sm py-5">
                          <p className="font-[OpenSans-Medium]">
                            {election.instructions}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Link href="/student/vote" className="block">
                        <button
                          className={`${
                            election.status.toLowerCase() === "active" && !hasVoted
                              ? "bg-blue-800 hover:bg-blue-900"
                              : "bg-gray-400 cursor-not-allowed"
                          } text-white px-4 py-3 rounded w-full text-center transition-all font-medium flex items-center justify-center`}
                          disabled={election.status.toLowerCase() !== "active" || hasVoted}
                        >
                          <span className="mr-2">🗳️</span> 
                          {hasVoted ? "Already Voted" : "Cast Your Vote"}
                        </button>
                      </Link>
                      
                      {/* Conditionally show View Results or View Candidates button */}
                      {hasVoted ? (
                        <Link href="/student/results" className="block">
                          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded w-full text-center transition-all font-medium flex items-center justify-center">
                            <span className="mr-2">📊</span> View Results
                          </button>
                        </Link>
                      ) : (
                        <Link href="/student/candidates" className="block">
                          <button className="bg-yellow-500 text-white hover:bg-yellow-600 px-4 py-3 rounded w-full text-center transition-all font-medium flex items-center justify-center">
                            <span className="mr-2">👥</span> View Candidates
                          </button>
                        </Link>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-4 text-right">
                      Last updated:{" "}
                      {election.lastUpdated
                        ? new Date(
                            election.lastUpdated.seconds * 1000
                          ).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              )}
            </div>

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
  );
};

export default StudentDashboard;
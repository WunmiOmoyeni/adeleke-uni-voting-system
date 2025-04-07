"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, firestore } from "../../../firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  count,
} from "firebase/firestore";
import LogoutModal from "@/components/logoutModal";
import AdminSidebar from "@/components/adminSidebar";

const AdminDashboard = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [status, setStatus] = useState("Upcoming");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [electionTitle, setElectionTitle] = useState("");
  const [electionDescription, setElectionDescription] = useState("");
  const [votingInstructions, setVotingInstructions] = useState("");
  const [resultsVisibility, setResultsVisibility] = useState("afterClose");
  const [candidateDeadline, setCandidateDeadline] = useState("");

  const [totalVoters, setTotalVoters] = useState<number>(0);
  const [votesCast, setVotesCast] = useState<number>(0);
  const [recentActivity, setRecentActivity] = useState<
    Array<{ action: string; timestamp: Date }>
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", message: "" });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const router = useRouter();

  // Fetch election data from Firestore
  const fetchElectionData = async () => {
    try {
      const electionDoc = await getDoc(doc(firestore, "election", "status"));
      if (electionDoc.exists()) {
        const electionData = electionDoc.data();
        setStatus(electionData.status || "Upcoming");
        setStartDate(electionData.startDate || "");
        setEndDate(electionData.endDate || "");
        setElectionTitle(electionData.title || "");
        setElectionDescription(electionData.description || "");
        setVotingInstructions(electionData.instructions || "");
        setResultsVisibility(electionData.resultsVisibility || "afterClose");
        setCandidateDeadline(electionData.candidateDeadline || "");
      }
    } catch (error) {
      console.error("Error fetching election data:", error);
      setSaveMessage({
        type: "error",
        message: "Failed to load election settings",
      });
    }
  };

  // Fetch total voters count
  // Enhanced vote fetching with error handling and console logging
  const fetchVoterMetrics = async () => {
    try {
      // Count total registered voters (students)
      const studentsSnapshot = await getDocs(collection(firestore, "students"));
      setTotalVoters(studentsSnapshot.size);

      // Now get only submitted votes
      const votesSnapshot = await getDocs(
        query(collection(firestore, "votes"), where("submitted", "==", true))
      );
      console.log(`Votes with submitted=true: ${votesSnapshot.size}`);
      setVotesCast(votesSnapshot.size);
    } catch (error) {
      console.error("Error fetching voter metrics:", error);
      // Consider adding user-visible error here
    }
  };

  // Fetch recent activity
  const fetchRecentActivity = async () => {
    try {
      const activitySnapshot = await getDocs(collection(firestore, "activity"));

      const activityData = activitySnapshot.docs
        .map((doc) => ({
          action: doc.data().action,
          timestamp: doc.data().timestamp.toDate(),
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5); // Get only the 5 most recent activities

      setRecentActivity(activityData);
    } catch (error) {
      console.error("Error fetching activity:", error);
    }
  };

  const handleSaveElectionData = async () => {
    // Form validation
    if (!electionTitle.trim()) {
      setSaveMessage({ type: "error", message: "Election title is required" });
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setSaveMessage({
        type: "error",
        message: "End date must be after start date",
      });
      return;
    }

    setIsSaving(true);
    setSaveMessage({ type: "", message: "" });

    try {
      await setDoc(doc(firestore, "election", "status"), {
        status,
        startDate,
        endDate,
        title: electionTitle,
        description: electionDescription,
        instructions: votingInstructions,
        resultsVisibility,
        candidateDeadline,
        lastUpdated: new Date(),
      });

      // Add to activity log
      await setDoc(doc(collection(firestore, "activity")), {
        action: `Election settings updated by ${userName || "Admin"}`,
        timestamp: new Date(),
      });

      setSaveMessage({
        type: "success",
        message: "Election details updated successfully",
      });

      // Refresh activity data
      fetchRecentActivity();
    } catch (error) {
      console.error("Error updating election status: ", error);
      setSaveMessage({
        type: "error",
        message: "Failed to update election details",
      });
    } finally {
      setIsSaving(false);

      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage({ type: "", message: "" });
      }, 3000);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(firestore, "admins", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(`${userData.lastName}`);
        } else {
          // If not an admin, redirect to login
          router.push("/login");
          return;
        }

        setIsLoading(false);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (userName) {
      // Load data once authenticated
      fetchElectionData();
      fetchVoterMetrics();
      fetchRecentActivity();
    }
  }, [userName]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error: ", error);
    }
  };

  // Preview student view
  const handlePreviewStudentView = () => {
    // Open student view in new tab or modal
    router.push("/admin-dashboard/student-preview");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-[OpenSans-Medium]">
            Hello, {userName ? userName : "Admin"} 👋
          </h1>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="bg-red-500 px-4 py-[7px] text-white rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Save Message */}
        {saveMessage.message && (
          <div
            className={`mb-4 p-3 rounded ${
              saveMessage.type === "success"
                ? "bg-green-100 text-green-800"
                : saveMessage.type === "error"
                ? "bg-red-100 text-red-800"
                : ""
            }`}
          >
            {saveMessage.message}
          </div>
        )}

        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          <div className="bg-white p-6 shadow-md rounded">
            <h3 className="text-[20px] font-[OpenSans-Bold]">Total Voters</h3>
            <p className="text-3xl mt-2">{totalVoters}</p>
          </div>

          <div className="bg-white p-6 shadow-md rounded">
            <h3 className="text-[20px] font-[OpenSans-Bold]">Votes Cast</h3>
            <p className="text-3xl mt-2">{votesCast}</p>
          </div>

          <div className="bg-white p-6 shadow-md rounded">
            <h3 className="text-[20px] font-[OpenSans-Bold]">Voting Status</h3>
            <p
              className={`text-2xl font-[OpenSans-Regular] mt-2 ${
                status === "Ongoing"
                  ? "text-green-500"
                  : status === "Upcoming"
                  ? "text-blue-500"
                  : "text-red-500"
              }`}
            >
              {status}
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white p-6 shadow-md rounded">
          <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <ul className="divide-y">
              {recentActivity.map((activity, index) => (
                <li key={index} className="py-2">
                  <div className="flex justify-between">
                    <span>{activity.action}</span>
                    <span className="text-gray-500 text-sm">
                      {activity.timestamp.toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent activity</p>
          )}
        </div>

        {/* Manage Election Section */}
        <div className="bg-white p-6 shadow-md rounded mt-8">
          <h3 className="text-xl font-bold border-b pb-2 mb-4">
            Manage Election
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Election Title:
              </label>
              <input
                type="text"
                value={electionTitle}
                onChange={(e) => setElectionTitle(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="e.g., Student Council Election 2025"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Status:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Start Date:
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                End Date:
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border p-2 rounded w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-1">
                Election Description:
              </label>
              <textarea
                value={electionDescription}
                onChange={(e) => setElectionDescription(e.target.value)}
                className="border p-2 rounded w-full h-24"
                placeholder="Describe the purpose and importance of this election..."
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-1">
                Voting Instructions:
              </label>
              <textarea
                value={votingInstructions}
                onChange={(e) => setVotingInstructions(e.target.value)}
                className="border p-2 rounded w-full h-24"
                placeholder="Provide step-by-step instructions for voters..."
              ></textarea>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Results Visibility:
              </label>
              <select
                value={resultsVisibility}
                onChange={(e) => setResultsVisibility(e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="afterClose">After Election Closes</option>
                <option value="immediately">Real-time Results</option>
                <option value="manual">Manual Release</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Candidate Registration Deadline:
              </label>
              <input
                type="datetime-local"
                value={candidateDeadline}
                onChange={(e) => setCandidateDeadline(e.target.value)}
                className="border p-2 rounded w-full"
              />
            </div>
          </div>

          <div className="flex mt-4 space-x-4">
            <button
              onClick={handleSaveElectionData}
              disabled={isSaving}
              className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors ${
                isSaving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSaving ? "Saving..." : "Save Election Data"}
            </button>
            <button
              onClick={handlePreviewStudentView}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              Preview Student View
            </button>
          </div>
        </div>
      </main>

      {/*Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
};

export default AdminDashboard;

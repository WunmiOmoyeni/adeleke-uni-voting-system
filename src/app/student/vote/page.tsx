"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { firestore, auth } from "../../../../firebaseConfig";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import Image from "next/image";

interface Candidate {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
}

const VotingPage = () => {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [selections, setSelections] = useState<{ [position: string]: string }>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    // Auth logic from your app
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user is a student
        const studentDoc = await getDoc(doc(firestore, "students", user.uid));
        if (studentDoc.exists()) {
          setStudentId(user.uid);
          setAuthChecking(false);
        } else {
          // Not a student, redirect to login
          router.push("/login");
        }
      } else {
        // No user logged in, redirect to login
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // Don't fetch data until auth is confirmed
    if (authChecking || !studentId) return;

    const checkIfVoted = async () => {
      try {
        // Check if the student has already voted (with submitted status)
        const votesQuery = query(
          collection(firestore, "votes"),
          where("studentId", "==", studentId),
          where("submitted", "==", true)
        );

        const votesSnapshot = await getDocs(votesQuery);
        if (!votesSnapshot.empty) {
          setHasVoted(true);
        }
      } catch (error) {
        console.error("Error checking voting status:", error);
        setError("Failed to verify voting status. Please try again later.");
      }
    };

    const fetchCandidates = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(firestore, "candidates")
        );
        const candidateList: Candidate[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Candidate[];

        setCandidates(candidateList);

        // Extract unique positions
        const uniquePositions = [
          ...new Set(candidateList.map((c) => c.position)),
        ];
        setPositions(uniquePositions);

        // Initialize selections object with empty values
        const initialSelections: { [position: string]: string } = {};
        uniquePositions.forEach((position) => {
          initialSelections[position] = "";
        });
        setSelections(initialSelections);
      } catch (error) {
        console.error("Error fetching candidates:", error);
        setError("Failed to load candidates. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    checkIfVoted();
    fetchCandidates();
  }, [studentId, authChecking, router]);

  const handleCandidateSelect = (position: string, candidateId: string) => {
    setSelections({
      ...selections,
      [position]: candidateId,
    });
  };

  // Update the handleSubmitVote function in your VotingPage component
  const handleSubmitVote = async () => {
    if (!studentId) {
      setError("You must be logged in to vote.");
      return;
    }

    // Validate that all positions have a selection
    const hasEmptySelections = Object.values(selections).some(
      (selection) => selection === ""
    );
    if (hasEmptySelections) {
      setError(
        "Please make a selection for all positions before submitting your vote."
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Create vote record with submitted field
      const voteData = {
        studentId,
        positionSelections: selections,
        timestamp: new Date(),
        submitted: true, // This field is critical for counting in admin dashboard
      };

      // Save to Firestore
      await addDoc(collection(firestore, "votes"), voteData);

      setSuccessMessage("Your vote has been successfully recorded!");
      setHasVoted(true);

      // Redirect after a brief pause to show success message
      setTimeout(() => {
        // Changed from dashboard to results page
        router.push("/student/results?newVote=true");
      }, 3000);
    } catch (error) {
      console.error("Error submitting vote:", error);
      setError("Failed to submit your vote. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-800 text-white py-6 px-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-white rounded-full p-2 mr-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center border-2 border-yellow-400">
                <span className="text-xl">🗳️</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold">Cast Your Vote</h1>
          </div>
          <Link href="/student/dashboard">
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-all">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Already Voted Message */}
        {hasVoted && !successMessage && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
            <p className="font-bold">
              You have already voted in this election.
            </p>
            <p>You can view the candidates but cannot vote again.</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <p className="font-bold">Success!</p>
            <p>{successMessage}</p>
            <p className="mt-2">Redirecting to dashboard...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Instructions Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">
            Voting Instructions
          </h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>
              Select one candidate for each position by clicking on their card
            </li>
            <li>You must vote for all positions before submitting</li>
            <li>Your vote is final and cannot be changed after submission</li>
            <li>
              {
                'You can click on "View Profile" to learn more about a candidate before voting'
              }
            </li>
          </ul>
        </div>

        {/* Voting Section */}
        {positions.map((position) => (
          <div key={position} className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-800 pb-2 border-b border-gray-200">
                {position}
              </h2>
              <div className="text-gray-600">
                {selections[position] ? (
                  <span className="text-green-600 font-medium">✓ Selected</span>
                ) : (
                  <span className="text-orange-500 font-medium">
                    Selection required
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates
                .filter((candidate) => candidate.position === position)
                .map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`bg-white border rounded-lg overflow-hidden shadow-md transition-all ${
                      selections[position] === candidate.id
                        ? "border-green-500 ring-2 ring-green-300"
                        : "border-gray-200 hover:shadow-lg"
                    }`}
                  >
                    <div className="relative h-48 overflow-hidden bg-blue-100">
                      {candidate.imageUrl ? (
                        <Image
                          src={candidate.imageUrl}
                          alt={candidate.name}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl">👤</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold mb-2">
                        {candidate.name}
                      </h3>

                      <div className="flex flex-col sm:flex-row gap-2 mt-3">
                        <Link
                          href={`/student/candidates/${candidate.id}?from=voting`}
                          className="flex-1"
                        >
                          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-all">
                            View Profile
                          </button>
                        </Link>

                        <button
                          onClick={() =>
                            handleCandidateSelect(position, candidate.id)
                          }
                          disabled={hasVoted}
                          className={`flex-1 py-2 rounded transition-all ${
                            hasVoted
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : selections[position] === candidate.id
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-yellow-500 hover:bg-yellow-600 text-white"
                          }`}
                        >
                          {selections[position] === candidate.id
                            ? "Selected"
                            : "Select"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Submit Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmitVote}
            disabled={hasVoted || submitting}
            className={`py-3 px-8 rounded-lg text-white font-bold text-lg transition-all ${
              hasVoted || submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-700 hover:bg-blue-800 shadow-lg hover:shadow-xl"
            }`}
          >
            {submitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : hasVoted ? (
              "You have already voted"
            ) : (
              "Submit Your Vote"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotingPage;

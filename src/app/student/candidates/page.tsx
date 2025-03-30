"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { firestore, auth } from "../../../../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface Candidate {
  id: string;
  name: string;
  position: string;
  imageUrl?: string;
}

const ViewCandidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [votes, setVotes] = useState<{ [key: string]: string }>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [electionActive, setElectionActive] = useState(false);
  const [confirmVote, setConfirmVote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      setLoading(true);
      try {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            router.push("/login");
            return;
          }
  
          // Fetch student data
          const studentRef = doc(firestore, "students", user.uid);
          const studentSnap = await getDoc(studentRef);
          
          if (studentSnap.exists()) {
            setStudent({
              id: user.uid,
              ...studentSnap.data()
            });
            
            // Continue with fetching election status and candidates
            // Only fetch these after we confirm the user exists
            const electionRef = doc(firestore, "election", "status");
            const electionSnap = await getDoc(electionRef);
            
            if (electionSnap.exists()) {
              const electionData = electionSnap.data();
              setElectionActive(electionData.status.toLowerCase() === "active");
              
              if (electionData.status.toLowerCase() !== "active") {
                setError("Voting is not currently active");
              }
            }
  
            // Check if student has already voted
            const votesQuery = query(
              collection(firestore, "votes"),
              where("studentId", "==", user.uid)
            );
            const votesSnap = await getDocs(votesQuery);
            
            if (!votesSnap.empty) {
              setHasVoted(true);
              const studentVotes = votesSnap.docs[0].data().selections || {};
              setVotes(studentVotes);
            }
  
            // Fetch candidates
            const candidatesSnapshot = await getDocs(collection(firestore, "candidates"));
            const candidatesData = candidatesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }) as Candidate);
  
            // Group candidates by position
            
            const uniquePositions = [...new Set(candidatesData.map(c => c.position))];
            setPositions(uniquePositions);
            setCandidates(candidatesData);
          } else {
            router.push("/login");
          }
        });
  
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    checkAuthAndFetchData();
  }, [router]);

  const handleVoteChange = (position: string, candidateId: string) => {
    setVotes((prev) => ({
      ...prev,
      [position]: candidateId,
    }));
  };

  const handleSubmitVotes = async () => {
    if (hasVoted) {
      setError("You have already cast your vote");
      return;
    }

    if (!electionActive) {
      setError("Voting is not currently active");
      return;
    }

    // Confirm before submitting
    setConfirmVote(true);
  };

  const submitVotes = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if all positions have votes
      const votedPositions = Object.keys(votes);
      if (votedPositions.length < positions.length) {
        setError("Please vote for all positions before submitting");
        setSubmitting(false);
        return;
      }

      // Add vote to database
      await addDoc(collection(firestore, "votes"), {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        matricNumber: student.matricNumber,
        selections: votes,
        timestamp: new Date(),
      });

      // Update student record to mark as voted
      await updateDoc(doc(firestore, "students", student.id), {
        hasVoted: true,
      });

      setHasVoted(true);
      setSuccess("Your vote has been successfully recorded!");

      // Close confirmation modal
      setConfirmVote(false);
    } catch (error) {
      console.error("Error submitting votes:", error);
      setError("Failed to submit your vote. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const goToDashboard = () => {
    router.push("/student/dashboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
      </div>
    );
  }

  console.log("Candidates Data:", candidates)

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header with school logo and colors */}
      <div className="bg-blue-800 text-white py-4 px-6 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-white rounded-full p-2 mr-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center border-2 border-yellow-400">
                <span className="text-xl">🏫</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold">Election Candidates</h1>
          </div>
          <button
            onClick={goToDashboard}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Student and Election Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                Hello, {student?.firstName} {student?.lastName}
              </h2>
              <p className="text-gray-600">
                Matric Number: {student?.matricNumber}
              </p>
            </div>

            <div className="mt-4 md:mt-0">
              <span
                className={`px-4 py-2 rounded-full text-white ${
                  hasVoted
                    ? "bg-gray-500"
                    : electionActive
                    ? "bg-green-500"
                    : "bg-yellow-500"
                }`}
              >
                {hasVoted
                  ? "Already Voted"
                  : electionActive
                  ? "Voting Open"
                  : "Voting Not Active"}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
              <p>{success}</p>
            </div>
          )}

          {hasVoted ? (
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4">
              <p className="font-medium">
                You have already cast your vote in this election.
              </p>
              <p>Your vote has been recorded and cannot be changed.</p>
            </div>
          ) : !electionActive ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4">
              <p className="font-medium">Voting is not currently active.</p>
              <p>Please check back during the scheduled election period.</p>
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 font-medium">
                Please vote for one candidate in each position.
              </p>
              <p className="text-sm">Your vote is confidential and secure.</p>
            </div>
          )}
        </div>

        {/* Candidates by Position */}
        {positions.map((position) => (
          <div
            key={position}
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">
              {position}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates
                .filter((candidate) => candidate.position === position)
                .map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`border rounded-lg p-4 ${
                      votes[position] === candidate.id
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-gray-200 hover:border-blue-300"
                    } transition-all`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="mb-3 w-24 h-24 overflow-hidden rounded-full border-2 border-blue-800">
                        {candidate.imageUrl ? (
                          <img
                            src={candidate.imageUrl}
                            alt={candidate.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-3xl">👤</span>
                          </div>
                        )}
                      </div>

                      <h3 className="font-semibold text-center">
                        {candidate.name}
                      </h3>

                      <div className="mt-4">
                        <label className="flex items-center justify-center cursor-pointer">
                          <input
                            type="radio"
                            name={position}
                            checked={votes[position] === candidate.id}
                            onChange={() =>
                              handleVoteChange(position, candidate.id)
                            }
                            disabled={hasVoted || !electionActive}
                            className="form-radio h-5 w-5 text-blue-800"
                          />
                          <span className="ml-2">Select</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Submit Votes Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 flex justify-between">
          {/* <button
            onClick={goToDashboard}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded transition-all"
          >
            Back to Dashboard
          </button> */}

          <button
            onClick={handleSubmitVotes}
            disabled={hasVoted || !electionActive || submitting}
            className={`px-6 py-3 rounded transition-all ${
              hasVoted || !electionActive
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-blue-800 hover:bg-blue-900 text-white"
            }`}
          >
            {submitting ? "Submitting..." : "Submit Your Vote"}
          </button>
        </div>

        {/* Confirmation Modal */}
        {confirmVote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h2 className="text-xl font-bold mb-4 text-blue-800">
                Confirm Your Vote
              </h2>

              <div className="mb-4">
                <p className="mb-2 font-medium">
                  You are about to cast your vote for:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                  {positions.map((position) => {
                    const selectedCandidate = candidates.find(
                      (c) => c.id === votes[position]
                    );
                    return (
                      <div key={position} className="mb-2 pb-2 border-b">
                        <p className="text-sm text-gray-600">{position}</p>
                        <p className="font-medium">
                          {selectedCandidate ? (
                            selectedCandidate.name
                          ) : (
                            <span className="text-red-500">
                              No candidate selected
                            </span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <span className="font-bold">Important:</span> Your vote cannot
                  be changed once submitted.
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setConfirmVote(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                >
                  Go Back
                </button>
                <button
                  onClick={submitVotes}
                  disabled={submitting}
                  className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded"
                >
                  {submitting ? "Submitting..." : "Confirm Vote"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewCandidates;

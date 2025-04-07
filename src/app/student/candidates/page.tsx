"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../../../../firebaseConfig";
import Link from "next/link";
import Image from "next/image";

interface Candidate {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  manifesto?: string;
}

const ViewCandidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        if (uniquePositions.length > 0) {
          setSelectedPosition(uniquePositions[0]);
        }
      } catch (error) {
        console.error("Error fetching candidates:", error);
        setError("Failed to load candidates. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with school colors */}
      <div className="bg-blue-800 text-white py-6 px-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-white rounded-full p-2 mr-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center border-2 border-yellow-400">
                <span className="text-xl">🏫</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold">Election Candidates</h1>
          </div>
          <Link href="/student/dashboard">
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-all">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Introduction Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">
            Candidate Listings
          </h2>
          <p className="text-gray-600 mb-4">
            Browse through the candidates running for various positions in the
            upcoming election. Click on a candidate to view more details about
            their manifesto and qualifications.
          </p>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p>{error}</p>
            </div>
          )}

          {/* Position Filter */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-gray-700 font-medium">
              Filter by position:
            </span>
            {positions.map((position) => (
              <button
                key={position}
                onClick={() => setSelectedPosition(position)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedPosition === position
                    ? "bg-blue-800 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {position}
              </button>
            ))}
            {positions.length > 0 && (
              <button
                onClick={() => setSelectedPosition("")}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedPosition === ""
                    ? "bg-blue-800 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All Positions
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-yellow-500 text-4xl mb-4">🗳️</div>
            <p className="text-gray-700 font-semibold text-lg">
              No candidates available at this time.
            </p>
            <p className="text-gray-600 mt-2">
              Check back later as candidate nominations are still in progress.
            </p>
          </div>
        ) : (
          <>
            {(selectedPosition ? positions : ["All Candidates"])
              .filter((pos) =>
                selectedPosition ? pos === selectedPosition : true
              )
              .map((position) => (
                <div key={position} className="mb-10">
                  <h2 className="text-xl font-bold text-blue-800 mb-4 pb-2 border-b border-gray-200">
                    {position}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {candidates
                      .filter((candidate) =>
                        selectedPosition
                          ? candidate.position === selectedPosition
                          : true
                      )
                      .map((candidate) => (
                        <div
                          key={candidate.id}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all"
                        >
                          <div className="relative h-48 overflow-hidden bg-blue-100">
                            {candidate.imageUrl ? (
                              <Image
                                src={candidate.imageUrl}
                                alt={candidate.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-5xl">👤</span>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                              <span className="text-white text-sm font-medium px-2 py-1 rounded bg-blue-800/80">
                                {candidate.position}
                              </span>
                            </div>
                          </div>
                          <div className="p-5">
                            <h3 className="text-lg font-semibold mb-2">
                              {candidate.name}
                            </h3>
                            {candidate.manifesto && (
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {candidate.manifesto}
                              </p>
                            )}
                           <Link href={`/student/candidates/${candidate.id}`}>
                              <button className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded transition-all">
                                View Profile
                              </button>
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </>
        )}
      </div>

      {/* Footer */}
      {/* <div className="bg-blue-800 text-white py-4 mt-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm opacity-80">
            © {new Date().getFullYear()} AU Student Election Portal. All rights
            reserved.
          </p>
        </div>
      </div> */}
    </div>
  );
};

export default ViewCandidates;

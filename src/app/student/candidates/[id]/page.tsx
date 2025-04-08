"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../../../../../firebaseConfig";
import Link from "next/link";
import Image from "next/image";

interface Candidate {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  manifesto?: string;
}

const CandidateProfile = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id;
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get the referrer from query params
  const from = searchParams.get('from') || 'candidates';

  useEffect(() => {
    if (!id) return;

    const fetchCandidate = async () => {
      try {
        const docRef = doc(firestore, "candidates", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCandidate({ id: docSnap.id, ...docSnap.data() } as Candidate);
        } else {
          setError("Candidate not found.");
        }
      } catch (error) {
        console.error("Error fetching candidate details:", error);
        setError("Failed to load candidate details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [id]);

  // Determine back link based on referrer
  const getBackLink = () => {
    if (from === 'voting') {
      return "/student/voting";
    }
    return "/student/candidates";
  };
  
  // Go back function
  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center mt-10">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-800 text-white py-6 px-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Candidate Profile</h1>
          <div className="flex space-x-4">
            {/* Dynamic back button */}
            <button
              onClick={handleGoBack}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-all"
            >
              Go Back
            </button>
            
            {/* Explicit links for direct navigation */}
            <Link href={getBackLink()}>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-all">
                {from === 'voting' ? 'Back to Voting' : 'Back to Candidates'}
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row items-center">
          <div className="w-40 h-40 md:w-60 md:h-60 bg-gray-200 rounded-full overflow-hidden mb-4 md:mb-0">
            {candidate?.imageUrl ? (
              <Image
                src={candidate.imageUrl}
                alt={candidate.name}
                width={300}
                height={300}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">
                👤
              </div>
            )}
          </div>
          <div className="md:ml-6 text-center md:text-left">
            <h2 className="text-3xl font-bold text-blue-800">
              {candidate?.name}
            </h2>
            <p className="text-gray-700 text-lg mt-2">
              Position:{" "}
              <span className="font-semibold">{candidate?.position}</span>
            </p>
          </div>
        </div>

        {candidate?.manifesto && (
          <div className="mt-6 bg-gray-100 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-blue-800 mb-3">Manifesto</h3>
            <p className="text-gray-700">{candidate.manifesto}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateProfile;
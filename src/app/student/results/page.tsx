'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { firestore, auth } from '../../../../firebaseConfig';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';

interface Candidate {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
}

interface ResultData {
  position: string;
  candidates: {
    id: string;
    name: string;
    imageUrl: string;
    voteCount: number;
  }[];
  totalVotes: number;
}

const ResultsPage = () => {
  const router = useRouter();
  const [results, setResults] = useState<ResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
//   const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  
  useEffect(() => {
    // Auth logic
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setStudentId(user.uid);
        setAuthChecking(false);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // Don't fetch data until auth is confirmed
    if (authChecking || !studentId) return;
    
    // Check if student has voted before showing results
    const checkVotingStatus = async () => {
      try {
        const votesQuery = query(
          collection(firestore, "votes"),
          where("studentId", "==", studentId),
          where("submitted", "==", true)
        );
        
        const votesSnapshot = await getDocs(votesQuery);
        if (votesSnapshot.empty) {
          // Student hasn't voted - redirect to voting page
          setError("You must vote before viewing results");
          setHasVoted(false);
          
          // Delay redirect to allow error message to be seen
          setTimeout(() => {
            router.push('/student/vote');
          }, 3000);
          return;
        }
        
        // Student has voted, continue loading results
        setHasVoted(true);
        fetchData();
      } catch (error) {
        console.error("Error checking voting status:", error);
        setError("Failed to verify voting status.");
      }
    };
    
    const fetchData = async () => {
      // Get candidates
      try {
        const candidatesSnapshot = await getDocs(collection(firestore, "candidates"));
        const candidateList = candidatesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Candidate[];
        
        // setCandidates(candidateList);
        
        // Set up real-time listener for votes
        setupVoteListener(candidateList);
      } catch (error) {
        console.error("Error fetching candidates:", error);
        setError("Failed to load candidates.");
      }
    };
    
    // Set up real-time listener for votes
    const setupVoteListener = (candidateList: Candidate[]) => {
      try {
        // Only count votes that have been submitted
        const votesQuery = query(
          collection(firestore, "votes"),
          where("submitted", "==", true)
        );
        
        const unsubscribe = onSnapshot(votesQuery, (snapshot) => {
          // Count total voters
          setTotalVoters(snapshot.docs.length);
          
          // Process votes by position
          if (candidateList.length > 0) {
            // Get all unique positions
            const positions = [...new Set(candidateList.map(c => c.position))];
            
            // Initialize results for each position
            const positionResults: ResultData[] = positions.map(position => {
              // Get candidates for this position
              const positionCandidates = candidateList
                .filter(c => c.position === position)
                .map(c => ({
                  id: c.id,
                  name: c.name,
                  imageUrl: c.imageUrl,
                  voteCount: 0
                }));
                
              return {
                position,
                candidates: positionCandidates,
                totalVotes: 0
              };
            });
            
            // Count votes for each candidate
            snapshot.docs.forEach(doc => {
              const voteData = doc.data();
              const selections = voteData.positionSelections || {};
              
              // Update vote counts for each position
              Object.entries(selections).forEach(([position, candidateId]) => {
                const positionResult = positionResults.find(r => r.position === position);
                if (positionResult) {
                  // Increment total votes for this position
                  positionResult.totalVotes++;
                  
                  // Increment vote count for the specific candidate
                  const candidate = positionResult.candidates.find(c => c.id === candidateId);
                  if (candidate) {
                    candidate.voteCount++;
                  }
                }
              });
            });
            
            setResults(positionResults);
          }
          
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up vote listener:", error);
        setError("Failed to load voting results.");
        setLoading(false);
      }
    };

    checkVotingStatus();
    
    // No cleanup needed here as checkVotingStatus will handle it
  }, [studentId, authChecking, router]);

  if (authChecking || (loading && hasVoted)) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
      </div>
    );
  }

  if (error && !hasVoted) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
          <p className="text-center mb-4">Redirecting to voting page...</p>
          <div className="flex justify-center">
            <Link href="/student/vote">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                Go to Voting Page
              </button>
            </Link>
          </div>
        </div>
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
                <span className="text-xl">📊</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold">Live Election Results</h1>
          </div>
          <div className="flex space-x-3">
            <Link href="/student/dashboard">
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-all">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Error Message */}
        {error && hasVoted && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Stats Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">Election Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-600 mb-1">Total Votes Cast</p>
              <p className="text-3xl font-bold text-blue-800">{totalVoters}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-gray-600 mb-1">Positions Being Contested</p>
              <p className="text-3xl font-bold text-green-800">{results.length}</p>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {results.map((positionResult) => (
          <div key={positionResult.position} className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-800 pb-2 border-b border-gray-200">
                {positionResult.position}
              </h2>
              <div className="text-gray-600">
                <span className="font-medium">{positionResult.totalVotes} votes</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {positionResult.candidates
                .sort((a, b) => b.voteCount - a.voteCount) // Sort by votes, descending
                .map((candidate, index) => {
                  const votePercentage = positionResult.totalVotes > 0 
                    ? (candidate.voteCount / positionResult.totalVotes * 100).toFixed(1) 
                    : '0';
                    
                  return (
                    <div 
                      key={candidate.id} 
                      className={`p-4 ${index === 0 && candidate.voteCount > 0 ? 'bg-blue-50' : 'bg-white'} ${
                        index !== positionResult.candidates.length - 1 ? 'border-b' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-4">
                          {candidate.imageUrl ? (
                            <Image
                              src={candidate.imageUrl}
                              alt={candidate.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-2xl">👤</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="font-medium">
                              {candidate.name}
                              {index === 0 && positionResult.totalVotes > 0 && candidate.voteCount > 0 && (
                                <span className="ml-2 text-sm bg-yellow-400 text-yellow-800 px-2 py-0.5 rounded-full">
                                  Leading
                                </span>
                              )}
                            </h3>
                            <div className="text-right">
                              <span className="font-bold">{candidate.voteCount}</span>
                              <span className="text-gray-500 text-sm ml-1">({votePercentage}%)</span>
                            </div>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${index === 0 && candidate.voteCount > 0 ? 'bg-blue-600' : 'bg-gray-400'}`}
                              style={{ width: `${votePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
        
        {/* Auto-refresh notice */}
        <div className="text-center text-gray-500 mt-8">
          <p>Results update automatically in real-time</p>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
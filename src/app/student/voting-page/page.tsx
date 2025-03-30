"use client"
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, firestore } from '../../../../firebaseConfig';

interface Candidate {
  id: string;
  name: string;
  position: string;
}

interface VotingState {
  hasVoted: boolean;
  currentVote: string | null;
}

const VotingPage = () => {
  const [candidates, setCandidates] = useState<{ [key: string]: Candidate[] }>({});
  const [loading, setLoading] = useState(true);
  const [votingState, setVotingState] = useState<VotingState>({
    hasVoted: false,
    currentVote: null
  });
  const [selectedCandidates, setSelectedCandidates] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidatesAndVotingStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Fetch candidates grouped by position
        const candidatesRef = collection(firestore, 'candidates');
        const q = query(
          candidatesRef,
          where('electionYear', '==', new Date().getFullYear())
        );
        const querySnapshot = await getDocs(q);

        const groupedCandidates: { [key: string]: Candidate[] } = {};
        querySnapshot.docs.forEach(doc => {
          const candidate = { id: doc.id, ...doc.data() } as Candidate;
          if (!groupedCandidates[candidate.position]) {
            groupedCandidates[candidate.position] = [];
          }
          groupedCandidates[candidate.position].push(candidate);
        });

        setCandidates(groupedCandidates);

        // Check if user has already voted
        const voteDoc = await getDoc(doc(firestore, 'votes', user.uid));
        if (voteDoc.exists()) {
          setVotingState({
            hasVoted: true,
            currentVote: voteDoc.data().votedCandidates
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load voting information');
        setLoading(false);
      }
    };

    fetchCandidatesAndVotingStatus();
  }, []);

  const handleCandidateSelect = (position: string, candidateId: string) => {
    setSelectedCandidates(prev => ({
      ...prev,
      [position]: candidateId
    }));
  };

  const submitVote = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate all positions are voted
      const allPositionsVoted = Object.keys(candidates).every(
        position => selectedCandidates[position]
      );

      if (!allPositionsVoted) {
        setError('Please vote for candidates in all positions');
        return;
      }

      // Submit vote
      await addDoc(collection(firestore, 'votes'), {
        studentId: user.uid,
        votedCandidates: selectedCandidates,
        timestamp: new Date()
      });

      // Update voting state
    //   setVotingState({
    //     hasVoted: true,
    //     // currentVote: selectedCandidates
    //   });

      // Optional: Update candidate vote count
      Object.entries(selectedCandidates).forEach(async ([position, candidateId]) => {
        const candidateRef = doc(firestore, 'candidates', candidateId);
        await updateDoc(candidateRef, {
        //   voteCount: increment(1)
        });
      });

    } catch (err) {
      console.error('Voting error:', err);
      setError('Failed to submit vote');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-center text-red-500 mt-10">{error}</div>
  );

  if (votingState.hasVoted) return (
    <div className="text-center mt-10">
      <h2 className="text-2xl font-bold mb-4">You have already voted!</h2>
      <div className="bg-green-100 p-4 rounded-lg max-w-md mx-auto">
        <h3 className="font-semibold mb-2">Your Previous Votes:</h3>
        {Object.entries(votingState.currentVote || {}).map(([position, candidateId]) => {
          const candidate = Object.values(candidates)
            .flat()
            .find(c => c.id === candidateId);
          return (
            <p key={position} className="text-gray-700">
              {position}: {candidate?.name || 'Unknown'}
            </p>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Cast Your Vote</h1>

      {Object.entries(candidates).map(([position, positionCandidates]) => (
        <div key={position} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{position}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {positionCandidates.map(candidate => (
              <div 
                key={candidate.id}
                className={`
                  border rounded-lg p-4 cursor-pointer transition 
                  ${selectedCandidates[position] === candidate.id 
                    ? 'bg-blue-100 border-blue-500' 
                    : 'hover:bg-gray-100'}
                `}
                onClick={() => handleCandidateSelect(position, candidate.id)}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-200 rounded-full mr-4 flex items-center justify-center">
                    {candidate.name[0]}
                  </div>
                  <div>
                    <h3 className="font-medium">{candidate.name}</h3>
                    <p className="text-sm text-gray-500">{position}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!selectedCandidates[position] && (
            <p className="text-red-500 text-sm mt-2">Please select a candidate</p>
          )}
        </div>
      ))}

      <div className="text-center mt-8">
        <button
          onClick={submitVote}
          disabled={Object.keys(selectedCandidates).length !== Object.keys(candidates).length}
          className={`
            px-8 py-3 rounded-lg text-white font-bold transition
            ${Object.keys(selectedCandidates).length === Object.keys(candidates).length 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-gray-400 cursor-not-allowed'}
          `}
        >
          Submit Vote
        </button>
      </div>
    </div>
  );
};

export default VotingPage;
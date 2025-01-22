"use client";
import { useState, useEffect } from "react";
import { firestore } from "../../../../firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

const positions = [
  "Executive President",
  "Vice President",
  "General Secretary",
  "Financial Secretary",
  "Treasurer",
  "Public Relations Officer",
  "Welfare Director",
  "Sports Director",
  "Social Director",
];

const ManageCandidates = () => {
  const [candidates, setCandidates] = useState<{ name: string; position: string }[]>([]);
  const [name, setName] = useState("");
  const [position, setPosition] = useState(positions[0]); // Default to first position
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCandidates = async () => {
      const querySnapshot = await getDocs(collection(firestore, "candidates"));
      const candidatesData = querySnapshot.docs.map(doc => doc.data() as { name: string; position: string });
      setCandidates(candidatesData);
    };

    fetchCandidates();
  }, []);

  const handleAddCandidate = () => {
    if (!name) return alert("Please enter the candidate's name");
    
    setCandidates([...candidates, { name, position }]);
    setName("");
    setPosition(positions[0]); // Reset to first position
  };

  const handleConfirmSubmission = async () => {
    setLoading(true);
    try {
      const candidatesRef = collection(firestore, "candidates");
      for (const candidate of candidates) {
        await addDoc(candidatesRef, candidate);
      }
      alert("Candidates successfully submitted!");
      setCandidates([]);
    } catch (error) {
      console.error("Error submitting candidates: ", error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Candidates</h1>

      {/* Candidate Form */}
      <div className="bg-white p-4 shadow-md rounded mb-6">
        <div className="mb-4">
          <label className="block text-gray-700">Position</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Candidate Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter candidate name"
          />
        </div>

        <button onClick={handleAddCandidate} className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Candidate
        </button>
      </div>

      {/* Display Candidates by Position */}
      <h2 className="text-xl font-semibold mb-2">Candidate List</h2>
      <div className="bg-white p-4 shadow-md rounded">
        {positions.map((pos) => (
          <div key={pos} className="mb-4">
            <h3 className="text-lg font-bold">{pos}</h3>
            <ul className="list-disc pl-6">
              {candidates.filter((c) => c.position === pos).map((candidate, index) => (
                <li key={index}>{candidate.name}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Confirm Submission Button */}
      <button
        onClick={handleConfirmSubmission}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
        disabled={loading || candidates.length === 0}
      >
        {loading ? "Submitting..." : "Confirm Submission"}
      </button>
    </div>
  );
};

export default ManageCandidates;

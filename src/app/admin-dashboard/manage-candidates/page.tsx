"use client";
import { useState, useEffect } from "react";
import { firestore, storage } from "../../../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs } from "firebase/firestore";
import AdminSidebar from "@/components/adminSidebar";

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
  const [candidates, setCandidates] = useState<
    {
      imageUrl: any;
      name: string;
      position: string;
    }[]
  >([]);
  const [name, setName] = useState("");
  const [position, setPosition] = useState(positions[0]);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false); // Controls modal visibility

  useEffect(() => {
    const fetchCandidates = async () => {
      const querySnapshot = await getDocs(collection(firestore, "candidates"));
      const candidatesData = querySnapshot.docs.map(
        (doc) =>
          ({
            name: doc.data().name,
            position: doc.data().position,
            imageUrl: doc.data().imageUrl || "",
          } as { name: string; position: string; imageUrl: string })
      );
      setCandidates(candidatesData);
    };

    fetchCandidates();
  }, []);

  const handleImageUpload = async () => {
    if (!image) return null;

    const imageRef = ref(
      storage,
      `candidate_images/${Date.now()}_${image.name}`
    );
    await uploadBytes(imageRef, image);
    return await getDownloadURL(imageRef);
  };

  const handleAddCandidate = () => {
    if (!name) {
      alert("Please enter the candidate's name");
      return;
    }

    const isDuplicate = candidates.some(
      (candidate) =>
        candidate.name &&
        name &&
        candidate.name.toLowerCase() === name.toLowerCase() &&
        candidate.position === position
    );

    if (isDuplicate) {
      alert("Candidate already exists for this position!");
      return;
    }

    setCandidates([...candidates, { name, position, imageUrl: "" }]);
    setName("");
    setPosition(positions[0]);
  };

  const handleConfirmSubmission = async () => {
    setShowModal(false); // Close modal
    setLoading(true);
    try {
      const candidatesRef = collection(firestore, "candidates");

      for (const candidate of candidates) {
        let imageUrl = ""; // Store image URL

        if (image) {
          const storageRef = ref(
            storage,
            `candidates/${candidate.name}_${Date.now()}`
          );
          const snapshot = await uploadBytes(storageRef, image);
          imageUrl = await getDownloadURL(snapshot.ref);
        }

        await addDoc(candidatesRef, {
          name: candidate.name,
          position: candidate.position,
          imageUrl,
        });
      }

      // Group candidates by position
      const groupedCandidates = positions.reduce((acc, pos) => {
        acc[pos] = candidates
          .filter((candidate) => candidate.position === pos)
          .map((c) => c.name);
        return acc;
      }, {} as Record<string, string[]>);

      // Save each position as a separate document in Firestore
      for (const [position, names] of Object.entries(groupedCandidates)) {
        if (names.length > 0) {
          await addDoc(candidatesRef, { position, candidates: names });
        }
      }

      alert("Candidates successfully submitted!");
      setCandidates([]);
    } catch (error) {
      console.error("Error submitting candidates: ", error);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 bg-white">
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
              <option value="">Select Position</option>
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

          <div className="mb-4">
            <label className="block text-gray-700">Candidate Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            onClick={handleAddCandidate}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Candidate
          </button>
        </div>

        {/* Display Candidates by Position */}
     

        {/* Confirm Submission Button */}
        <button
          onClick={() => setShowModal(true)} // Show modal on click
          className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg"
          disabled={loading || candidates.length === 0}
        >
          {loading ? "Submitting..." : "Confirm Submission"}
        </button>

        {/* Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg text-center w-96">
              <h2 className="text-lg font-bold mb-4">Confirm Submission</h2>
              <p className="mb-4">
                Are you sure you want to submit the candidates?
              </p>
              <div className="flex justify-around">
                <button
                  onClick={() => setShowModal(false)} // Close modal
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  No
                </button>
                <button
                  onClick={handleConfirmSubmission} // Proceed with submission
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCandidates;

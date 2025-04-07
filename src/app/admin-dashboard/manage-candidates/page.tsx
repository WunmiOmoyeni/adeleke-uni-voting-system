"use client";
import { useState, useEffect, ChangeEvent } from "react";
import { firestore } from "../../../../firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import AdminSidebar from "@/components/adminSidebar";
import CandidateTable from "@/components/candidateTable";
import Image from "next/image";

// Define positions as individual strings
const POSITIONS = {
  EXECUTIVE_PRESIDENT: "Executive President",
  VICE_PRESIDENT: "Vice President",
  GENERAL_SECRETARY: "General Secretary",
  FINANCIAL_SECRETARY: "Financial Secretary",
  TREASURER: "Treasurer",
  PRO: "Public Relations Officer",
  WELFARE_DIRECTOR: "Welfare Director",
  SPORTS_DIRECTOR: "Sports Director",
  SOCIAL_DIRECTOR: "Social Director",
};

// Convert to array for select options
const positionOptions = Object.values(POSITIONS);

interface Candidate {
  id: string;
  name: string;
  position: string;
  image: string | null;
  file?: File | null; // To store the file for later upload
}

const ManageCandidates = () => {
  const [previewCandidates, setPreviewCandidates] = useState<Candidate[]>([]);
  const [savedCandidates, setSavedCandidates] = useState<Candidate[]>([]);
  const [name, setName] = useState("");
  const [position, setPosition] = useState(POSITIONS.EXECUTIVE_PRESIDENT);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchSavedCandidates = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(
          collection(firestore, "candidates")
        );
        const candidatesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          position: doc.data().position,
          image: doc.data().imageUrl || null,
        }));
        setSavedCandidates(candidatesData);
      } catch (error) {
        console.error("Error fetching candidates:", error);
        setError("Failed to load existing candidates. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSavedCandidates();
  }, []);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file.");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const addCandidate = () => {
    if (!name.trim() || !position) {
      setError("Name and position are required.");
      return;
    }

    if (!image && !imagePreview) {
      setError("Please upload a candidate image.");
      return;
    }

    const duplicateInPreview = previewCandidates.some(
      (candidate) =>
        candidate.name?.toLowerCase().trim() === name.toLowerCase().trim() &&
        candidate.position === position
    );

    const duplicateInSaved = savedCandidates.some(
      (candidate) =>
        candidate.name?.toLowerCase().trim() === name.toLowerCase().trim() &&
        candidate.position === position
    );

    if (duplicateInPreview || duplicateInSaved) {
      setError("A candidate with this name and position already exists!");
      return;
    }

    const newCandidate: Candidate = {
      id: `preview_${Date.now()}`,
      name: name.trim(),
      position,
      image: imagePreview,
      file: image,
    };

    setPreviewCandidates([...previewCandidates, newCandidate]);

    setName("");
    setPosition(POSITIONS.EXECUTIVE_PRESIDENT);
    setImage(null);
    setImagePreview(null);
    setError(null);
  };

  const removePreviewCandidate = (candidateId: string) => {
    setPreviewCandidates(
      previewCandidates.filter((candidate) => candidate.id !== candidateId)
    );
  };

  // Helper function to upload an image to Cloudinary
  // Modified uploadToCloudinary function
  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    console.log("Cloud name:", cloudName);
    console.log("Upload preset:", uploadPreset);
    
    if (!cloudName || !uploadPreset) {
      console.error('Missing Cloudinary configuration');
      throw new Error('Missing Cloudinary configuration');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Cloudinary error details:', data);
        throw new Error(data.error?.message || 'Failed to upload');
      }
      
      return data.secure_url;
    } catch (error) {
      console.error('Error details:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log("Cloudinary Cloud Name:", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
    console.log("Cloudinary Upload Preset:", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
  }, []);

  const handleConfirmSubmission = async () => {
    if (previewCandidates.length === 0) {
      setError("No candidates to submit.");
      setShowModal(false);
      return;
    }

    setShowModal(false);
    setSubmitting(true);

    try {
      const candidatesRef = collection(firestore, "candidates");
      const newSavedCandidates: Candidate[] = [];

      for (const candidate of previewCandidates) {
        let imageUrl = null;

        if (candidate.file) {
          // Upload to Cloudinary instead of Firebase Storage
          imageUrl = await uploadToCloudinary(candidate.file);
        }

        // Add to Firestore
        const docRef = await addDoc(candidatesRef, {
          name: candidate.name,
          position: candidate.position,
          imageUrl: imageUrl,
        });

        // Add to new saved candidates with Firestore ID
        newSavedCandidates.push({
          id: docRef.id,
          name: candidate.name,
          position: candidate.position,
          image: imageUrl,
        });
      }

      // Update saved candidates with the new ones
      setSavedCandidates([...savedCandidates, ...newSavedCandidates]);

      setPreviewCandidates([]);
      alert("All candidates submitted successfully!");
    } catch (error) {
      console.error("Error submitting candidates:", error);
      setError("Failed to submit candidates. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6 bg-white">
        <h1 className="text-2xl font-bold mb-4">Manage Candidates</h1>

        {/* Candidate Form */}
        <div className="bg-white p-6 shadow-md rounded mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Candidate</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Position
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {positionOptions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Candidate Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter candidate name"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Candidate Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-2 border rounded"
            />
            {imagePreview && (
              <div className="mt-2">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded border"
                />
              </div>
            )}
          </div>

          <button
            onClick={addCandidate}
            disabled={loading || submitting}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 transition-colors"
          >
            Add to Preview List
          </button>
        </div>

        {/* Preview Candidates */}
        <div className="bg-white p-6 shadow-md rounded mb-6">
          <h2 className="text-xl font-semibold mb-4">Candidates to Submit</h2>

          <CandidateTable
            candidates={previewCandidates}
            showActions={true}
            onRemove={removePreviewCandidate}
            emptyMessage="No candidates in preview list yet. Add candidates using the form above."
          />

          {previewCandidates.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowModal(true)}
                disabled={submitting}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400 transition-colors"
              >
                {submitting ? "Submitting..." : "Submit All Candidates"}
              </button>
            </div>
          )}
        </div>

        {/* Existing Candidates */}
        <div className="bg-white p-6 shadow-md rounded">
          <h2 className="text-xl font-semibold mb-4">Existing Candidates</h2>

          {loading ? (
            <p className="text-gray-500">Loading candidates...</p>
          ) : (
            <CandidateTable
              candidates={savedCandidates}
              showActions={false}
              emptyMessage="No candidates saved in the database yet."
              title=""
            />
          )}
        </div>

        {/* Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-lg text-center w-96">
              <h2 className="text-lg font-bold mb-4">Confirm Submission</h2>
              <p className="mb-4">
                Are you sure you want to submit {previewCandidates.length}{" "}
                candidate(s) to the database?
              </p>
              <div className="flex justify-around">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubmission}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Submit
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

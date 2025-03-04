"use client";

import Image from "next/image";

interface Candidate {
  id: string;
  image: string | null;
  name: string;
  position: string;
}

interface CandidateTableProps {
  candidates: Candidate[];
  showActions?: boolean;
  onRemove?: (id: string) => void;
  title?: string;
  emptyMessage?: string;
}

const CandidateTable = ({
  candidates,
  showActions = false,
  onRemove,
  title = "Candidates",
  emptyMessage = "No candidates available"
}: CandidateTableProps) => {
  if (candidates.length === 0) {
    return <p className="text-gray-500 my-4">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      {title && <h3 className="text-lg font-medium mb-3">{title}</h3>}
      
      <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b text-left">Image</th>
            <th className="py-2 px-4 border-b text-left">Candidate Name</th>
            <th className="py-2 px-4 border-b text-left">Position</th>
            {showActions && <th className="py-2 px-4 border-b text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b">
                {candidate.image ? (
                  typeof candidate.image === 'string' ? (
                    <img
                      src={candidate.image}
                      alt={candidate.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <Image
                      src={candidate.image}
                      alt={candidate.name}
                      width={50}
                      height={50}
                      className="rounded-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 text-xs">No image</span>
                  </div>
                )}
              </td>
              <td className="py-2 px-4 border-b">{candidate.name}</td>
              <td className="py-2 px-4 border-b">{candidate.position}</td>
              {showActions && onRemove && (
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => onRemove(candidate.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CandidateTable;

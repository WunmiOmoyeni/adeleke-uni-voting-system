import React from "react";

interface LogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg text-center">
        <h2 className="text-xl font-bold mb-4">Are you sure you want to logout?</h2>
        <div className="flex justify-center space-x-4">
          <button onClick={onConfirm} className="bg-yellow-700 px-4 py-2 text-white rounded">
            Yes
          </button>
          <button onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded">
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;

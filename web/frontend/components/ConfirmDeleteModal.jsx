import React from "react";

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, id }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center mb-12"
      onClick={onClose}
    >
      <div
        className="bg-white border p-6 rounded-lg shadow-md w-1/3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Confirm Deletion</h2>
        <p className="text-gray-600">Are you sure you want to delete ?</p>
        <div className="mt-4 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(id)}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;

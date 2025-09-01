import React, { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast, ToastContainer } from "react-toastify";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { IoEyeSharp } from "react-icons/io5";
import { FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
// import ClipLoader from "react-spinners/ClipLoader";

const BadgesTable = ({
  badges,
  setBadges,
  totalPages,
  currentPage,
  onPageChange,
}) => {
  const [loadingBadgeId, setLoadingBadgeId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [badgeIdToDelete, setBadgeIdToDelete] = useState(null);
  const [showNoBadgesMessage, setShowNoBadgesMessage] = useState(false);

  const navigate = useNavigate();

  const openDeleteModal = (id) => {
    setBadgeIdToDelete(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBadgeIdToDelete(null);
  };

  const handleDetailsBadge = (id) => {
    navigate(`/badge-details?id=${id}`);
  };

  const handleEditBadge = (id) => {
    navigate(`/badge-edit?id=${id}`);
  };

  const handleDelete = async (id) => {
    setLoadingBadgeId(id);
    try {
      const response = await fetch(`/api/delete-badges`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ badges_id: id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Badge deleted successfully!", { autoClose: 2000 });

        const updatedBadges = badges?.filter((badge) => badge.badge_id !== id);
        setBadges(updatedBadges);
      } else {
        toast.error(result.message || "Failed to delete badge.", {
          autoClose: 2000,
        });
      }
    } catch (error) {
      console.error("Error deleting badge:", error);
    } finally {
      setLoadingBadgeId(null);
      closeModal();
    }
  };

  useEffect(() => {
    // Set a timeout before showing "No Category found" message
    const timer = setTimeout(() => {
      if (!badges?.length) {
        setShowNoBadgesMessage(true);
      }
    }, 2000); // 2-second delay before showing the "No Category found" message

    return () => clearTimeout(timer); // Clean up the timeout when the component unmounts or the category state changes
  }, [badges]);

  return (
    <div className="overflow-x-auto mx-auto max-w-5xl p-4">
      <ToastContainer />
      {badges?.length > 0 ? (
        <>
          <table className="w-full border-collapse bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-left">
                <th className="p-4">Badge Name</th>
                <th className="p-4">Points Required</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {badges?.map((badge) => (
                <tr
                  key={badge.badge_id}
                  className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-300"
                >
                  <td className="p-4 text-gray-900 dark:text-white">
                    {badge.badge_name}
                  </td>
                  <td className="p-4 text-gray-900 dark:text-white">
                    {badge.points_required}
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => handleDetailsBadge(badge.badge_id)}
                      className="text-blue-500 hover:text-blue-700 cursor-pointer"
                    >
                      <IoEyeSharp />
                    </button>
                    <button
                      onClick={() => handleEditBadge(badge.badge_id)}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => openDeleteModal(badge.badge_id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      disabled={loadingBadgeId === badge.badge_id}
                    >
                      {loadingBadgeId === badge.badge_id ? (
                        "Deleting..."
                      ) : (
                        <RiDeleteBin6Line />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center mt-4">
            {totalPages > 1 && (
              <ReactPaginate
                previousLabel={"Previous"}
                nextLabel={"Next"}
                breakLabel={"..."}
                pageCount={totalPages}
                marginPagesDisplayed={2}
                pageRangeDisplayed={3}
                onPageChange={onPageChange}
                containerClassName="flex justify-center py-4 gap-4"
                activeClassName="font-bold text-blue-500"
                previousLinkClassName={`px-3 py-1 rounded cursor-pointer ${
                  currentPage === 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200"
                }`}
                nextLinkClassName={`px-3 py-1 rounded cursor-pointer ${
                  currentPage === totalPages
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200"
                }`}
                pageLinkClassName="px-3 py-1 cursor-pointer"
              />
            )}
          </div>
        </>
      ) : showNoBadgesMessage ? ( // Check if to show the "No posts found" message
        <p className="text-center text-gray-500 dark:text-gray-400">
          No Badges found.
        </p>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-t-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
          <p className="text-center text-gray-500 dark:text-gray-400">
            Loading badges...
          </p>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleDelete}
        id={badgeIdToDelete}
        entityName="badge"
      />
    </div>
  );
};

export default BadgesTable;

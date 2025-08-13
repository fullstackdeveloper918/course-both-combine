import React, { useState, useEffect } from "react";
import ReactPaginate from "react-paginate";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { RiDeleteBin6Line } from "react-icons/ri";
// import ClipLoader from "react-spinners/ClipLoader";

const TagTable = ({ tags, setTags, totalPages, currentPage, onPageChange }) => {
  const [loadingTagId, setLoadingTagId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagIdToDelete, setTagIdToDelete] = useState(null);
  const [showNoTagsMessage, setShowNoTagsMessage] = useState(false);
  const navigate = useNavigate();

  const handleDetailsTag = (id) => {
    navigate(`/tag-details?id=${id}`);
  };

  const handleEditTag = (id) => {
    navigate(`/tag-edit?id=${id}`);
  };

  const handleDelete = async (id) => {
    setLoadingTagId(id);
    try {
      const response = await fetch(`/api/delete-tag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag_id: id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Tag deleted successfully!", { autoClose: 2000 });

        // Remove tag from state immediately
        const updatedTags = tags?.filter((tag) => tag.tag_id !== id);
        setTags(updatedTags);
      } else {
        toast.error(result.message || "Failed to delete tag.", { autoClose: 2000 });
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
    } finally {
      setLoadingTagId(null);
      setIsModalOpen(false);
    }
  };

  console.log("delted tag", tags)
  console.log("remain tag", tags)

  const openDeleteModal = (id) => {
    setTagIdToDelete(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTagIdToDelete(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!tags?.length) {
        setShowNoTagsMessage(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [tags]);

  return (
    <div className="overflow-x-auto mx-auto max-w-5xl p-4">
      <ToastContainer />
      {tags?.length > 0 ? (
        <>
          <table className="w-full border-collapse bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-left">
                <th className="p-4">Tag Name</th>
                <th className="p-4">Category Name</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags?.map((tag) => (
                <tr key={tag.tag_id} className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-300">
                  <td className="p-4 text-gray-900 dark:text-white">{tag.tag_name || "N/A"}</td>
                  <td className="p-4 text-gray-900 dark:text-white">{tag.category_name || "N/A"}</td>
                  <td className="py-6 pl-6">
                    <button
                      onClick={() => openDeleteModal(tag.tag_id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      disabled={loadingTagId === tag.tag_id}
                    >
                      {loadingTagId === tag.tag_id ? "Deleting..." : <RiDeleteBin6Line />}
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
                previousLinkClassName={`px-3 py-1 rounded cursor-pointer ${currentPage === 1 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gray-200"}`}
                nextLinkClassName={`px-3 py-1 rounded cursor-pointer ${currentPage === totalPages ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gray-200"}`}
                pageLinkClassName="px-3 py-1 cursor-pointer"
              />
            )}
          </div>
        </>
      ) : showNoTagsMessage ? (
        <p className="text-center text-gray-500 dark:text-gray-400">No tags found.</p>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-t-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
          <p className="text-center text-gray-500 dark:text-gray-400">Loading Tag...</p>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleDelete}
        id={tagIdToDelete}
        entityName="tag"
      />
    </div>
  );
};

export default TagTable;

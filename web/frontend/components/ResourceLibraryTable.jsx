import React, { useState, useEffect } from "react";
import ReactPaginate from "react-paginate";
import { IoEyeSharp } from "react-icons/io5";
import { FaEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast, ToastContainer } from "react-toastify";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { useNavigate } from "react-router-dom";
// import ClipLoader from "react-spinners/ClipLoader";

const ResourceLibraryTable = ({ resourceLibrary, setResourceLibrary, totalPages, currentPage, onPageChange }) => {
  const [deletingResourceId, setDeletingResourceId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resourceIdToDelete, setResourceIdToDelete] = useState(null);
  const [noDataMessage, setNoDataMessage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!resourceLibrary?.length) {
      setTimeout(() => setNoDataMessage(true), 1000);
    } else {
      setNoDataMessage(false);
    }
  }, [resourceLibrary]);

  const handleDetailsResource = (id) => {
    navigate(`/resource-details?id=${id}`);
  };

  const handleEditResource = (id) => {
    navigate(`/resource-edit?id=${id}`);
  };

  const handleDelete = async (id) => {
    setDeletingResourceId(id);
    try {
      const response = await fetch(`/api/delete-resource-library`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resource_id: id }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Resource deleted successfully!", { autoClose: 2000 });

        // Option 1: Remove the resource from the local state
        const updatedResources = resourceLibrary?.data?.filter(
          (resource) => resource.resource_id !== id
        );
        setResourceLibrary({data:updatedResources});
      } else {
        toast.error(result.message || "Failed to delete resource.", { autoClose: 2000 });
      }
    } catch (error) {
      console.error("Error deleting resource:", error);
    } finally {
      setDeletingResourceId(null);
      setIsModalOpen(false);
    }
  };

  const openDeleteModal = (id) => {
    setResourceIdToDelete(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setResourceIdToDelete(null);
  };

  return (
    <div className="overflow-x-auto mx-auto max-w-5xl p-4">
      <ToastContainer />
      {resourceLibrary?.data?.length > 0 ? (
        <>
          <table className="w-full border-collapse bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-left">
                <th className="p-4">Title</th>
                <th className="p-4">Content</th>
                <th className="p-4 w-36">Resource Type</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resourceLibrary?.data?.map((resource) => (
                <tr key={resource.resource_id} className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-300">
                  <td className="p-4 text-gray-600 dark:text-gray-400">{resource.title || 'N/A'}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">
                    <div dangerouslySetInnerHTML={{ __html: resource.content }} />
                  </td>
                  <td className="p-4 text-gray-900 dark:text-white">{resource.resource_type || 'N/A'}</td>
                  <td className="py-6 pr-4 flex justify-center gap-4">
                    <button
                      onClick={() => handleDetailsResource(resource.resource_id)}
                      className="text-blue-500 hover:text-blue-700 cursor-pointer"
                    >
                      <IoEyeSharp />
                    </button>
                    <button
                      onClick={() => handleEditResource(resource.resource_id)}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => openDeleteModal(resource.resource_id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      disabled={deletingResourceId === resource.resource_id}
                    >
                      {deletingResourceId === resource.resource_id ? "Deleting..." : <RiDeleteBin6Line />}
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
            nextLinkClassName={`px-3 py-1 rounded cursor-pointer ${currentPage === totalPages  ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gray-200"}`}
            pageLinkClassName="px-3 py-1 cursor-pointer"
          />
        )} 
          </div>
        </>
      ) : noDataMessage ? (
        <p className="text-center text-gray-500 dark:text-gray-400">No resources found.</p>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-t-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
          <p className="text-center text-gray-500 dark:text-gray-400">Loading resources library...</p>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleDelete}
        id={resourceIdToDelete}
        entityName="resource"
      />
    </div>
  );
};

export default ResourceLibraryTable;

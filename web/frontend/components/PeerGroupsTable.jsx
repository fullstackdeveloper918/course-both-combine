import React, { useState, useEffect } from "react";
import ReactPaginate from "react-paginate";
import { IoEyeSharp } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import { FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { RiDeleteBin6Line } from "react-icons/ri";
// import ClipLoader from "react-spinners/ClipLoader";

const PeerGroupsTable = ({ peerGroups, setPeerGroups, totalPages, currentPage, onPageChange }) => {
  const [deletingPeerId, setDeletingPeerId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [peerGroupIdToDelete, setPeerGroupIdToDelete] = useState(null);
  const [showNoPeerGroupsMessage, setShowNoPeerGroupsMessage] = useState(false);
  const navigate = useNavigate();

  const handlePeerGroupDetails = (id) => {
    navigate(`/peer-groups-details?id=${id}`);
  };

  const handleEditPeerGroup = (id) => {
    navigate(`/peer-groups-edit?id=${id}`);
  };

  const handleDeletePeerGroup = async (id) => {
    setDeletingPeerId(id);
    try {
      const response = await fetch(`/api/delete-peer-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peer_group_id: id }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Peer group deleted successfully!", { autoClose: 2000 });
        const updatedPeerGroups = peerGroups?.filter((peerGroup) => peerGroup.group_id !== id);
        setPeerGroups(updatedPeerGroups);
      } else {
        toast.error(result.message || "Failed to delete peer group.", { autoClose: 2000 });
      }
    } catch (error) {
      console.error("Error deleting peer group:", error);
    } finally {
      setDeletingPeerId(null);
      setIsModalOpen(false);
    }
  };

  console.log("peerGroups",peerGroups)

  const openDeleteModal = (id) => {
    setPeerGroupIdToDelete(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPeerGroupIdToDelete(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!peerGroups?.length) {
        setShowNoPeerGroupsMessage(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [peerGroups]);

  return (
    <div className="overflow-x-auto mx-auto max-w-5xl p-4">
      <ToastContainer />
      {peerGroups?.length > 0 ? (
        <>
          <table className="w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-4 text-left w-40">Peer Group Name</th>
                <th className="p-4 text-left">Peer Group Description</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {peerGroups?.map((peerGroup, index) => (
                <tr key={index} className="border-b">
                  <td className="p-4">{peerGroup.name || 'N/A'}</td>
                  <td className="p-4">{peerGroup.description}</td>
                  <td className="p-4 flex gap-4">
                    <button onClick={() => handlePeerGroupDetails(peerGroup.group_id)} className="text-blue-500 hover:text-blue-700 cursor-pointer"><IoEyeSharp /></button>
                    <button onClick={() => handleEditPeerGroup(peerGroup.group_id)} className="text-gray-500 hover:text-gray-700 cursor-pointer"><FaEdit /></button>
                    <button onClick={() => openDeleteModal(peerGroup.group_id)} disabled={deletingPeerId === peerGroup.group_id} className="text-red-500 hover:text-red-700 cursor-pointer">
                      {deletingPeerId === peerGroup.group_id ? "Deleting..." : <RiDeleteBin6Line />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        </>
      ) : showNoPeerGroupsMessage ? (
        <p className="text-center text-gray-500 dark:text-gray-400">No peer groups found.</p>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-t-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
          <p className="text-center text-gray-500 dark:text-gray-400">Loading peer groups...</p>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleDeletePeerGroup}
        id={peerGroupIdToDelete}
      />
    </div>
  );
};

export default PeerGroupsTable;

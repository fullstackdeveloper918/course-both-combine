import React, { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import { IoEyeSharp } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { FaEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";

const SuccessStoryTable = ({ successStories, setSuccessStories, totalPages, currentPage, onPageChange, port }) => {
  const [deletingStoryId, setDeletingStoryId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storyIdToDelete, setStoryIdToDelete] = useState(null);
  const [showNoSuccessStoryMessage, setShowNoSuccessStoryMessage] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState(null); // Track the selected story for thumbnail and video
  const navigate = useNavigate();

  const handleDetailsStory = (id) => {
    navigate(`/success-story-details?id=${id}`);
  };

  const handleEditStory = (id) => {
    navigate(`/success-story-edit?id=${id}`);
  };

  const handleDelete = async (id) => {
    setDeletingStoryId(id);
    try {
      const response = await fetch(`/api/delete-success-stories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ story_id: id }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Story deleted successfully!", { autoClose: 2000 });
        const updatedStories = successStories.filter((story) => story.story_id !== id);
        setSuccessStories(updatedStories);
      } else {
        toast.error(result.message || "Failed to delete story.", { autoClose: 2000 });
      }
    } catch (error) {
      console.error("Error deleting story:", error);
    } finally {
      setDeletingStoryId(null);
      setIsModalOpen(false);
    }
  };

  const openDeleteModal = (id) => {
    setStoryIdToDelete(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setStoryIdToDelete(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!successStories?.length) {
        setShowNoSuccessStoryMessage(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [successStories]);

  // Handle thumbnail click, setting the selected story ID to show video
  const handleThumbnailClick = (story_id) => {
    setSelectedStoryId(story_id); // Update selectedStoryId to the clicked story's id
  };

  return (
    <div className="overflow-x-auto mx-auto max-w-5xl p-4">
      <ToastContainer />
      {successStories?.length > 0 ? (
        <>
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-left">
                <th className="p-4">Title</th>
                <th className="p-4">Content</th>
                <th className="p-4">Video</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {successStories?.map((story) => (
                <tr key={story.story_id} className="border-b hover:bg-gray-50 transition duration-300">
                  <td className="p-4">{story.title || 'N/A'}</td>
                  <td className="p-4">{story.content || 'N/A'}</td>
                  <td className="px-4">
                    {/* If selected story_id matches the current story's id, display the video */}
                    {story.video_url && selectedStoryId === story.story_id ? (
                      <video width="240" height="280" controls>
                        {/* <source src={`https://zocdoc-admin.onrender.com${story.video_url}`} type="video/mp4" /> */}
                        <source src={`https://zocdoc-admin.onrender.com${story.video_url}`} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : null}
                  {/* </td>
                  <td className="p-4"> */}
                    {/* Display thumbnail if it exists and is not already selected */}
                    {story.thumbnail_url && selectedStoryId !== story.story_id ? (
                      // <div className="relative w-full p-2" >
                        <img
                          src={
                            `https://zocdoc-admin.onrender.com${story.thumbnail_url}`
                          }
                          alt="Thumbnail"
                          className="object-cover rounded cursor-pointer"
                          width="100"
                          height="100"
                          onClick={() => handleThumbnailClick(story.story_id)}
                          style={{width:"50%", height: "108px" , border:"1px solid gray"}}
                          // onError={(e) => {
                          //   e.target.onerror = null;  // Prevent infinite loop in case the placeholder also fails
                          //   e.target.src = 'https://via.placeholder.com/100x108.png?text=No+Image'; // Placeholder image URL
                          // }}
                        />
                      // </div>
                    ) : null}
                  </td>
                  <td className="py-8 flex gap-2 justify-center items-center">
                    <button onClick={() => handleDetailsStory(story.story_id)} className="text-blue-500 hover:text-blue-700 cursor-pointer">
                      <IoEyeSharp />
                    </button>
                    <button onClick={() => handleEditStory(story.story_id)} className="text-gray-500 hover:text-gray-700 cursor-pointer">
                      <FaEdit />
                    </button>
                    <button onClick={() => openDeleteModal(story.story_id)} className="text-red-500 hover:text-red-700 cursor-pointer" disabled={deletingStoryId === story.story_id}>
                      {deletingStoryId === story.story_id ? "Deleting..." : <RiDeleteBin6Line />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination UI */}
          <div className="my-4">
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
      ) : showNoSuccessStoryMessage ? (
        <p className="text-center text-gray-500 dark:text-gray-400">No success story found.</p>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-t-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
          <p className="text-center text-gray-500 dark:text-gray-400">Loading success story...</p>
        </div>
      )}
      <ConfirmDeleteModal isOpen={isModalOpen} onClose={closeModal} onConfirm={handleDelete} id={storyIdToDelete} />
    </div>
  );
};

export default SuccessStoryTable;

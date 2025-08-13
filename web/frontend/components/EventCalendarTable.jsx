import React, { useState, useEffect } from "react";
import ReactPaginate from "react-paginate";
import { IoEyeSharp } from "react-icons/io5";
import { FaEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
// import ClipLoader from "react-spinners/ClipLoader";

const EventTable = ({
  events,
  setEvents,
  totalPages,
  currentPage,
  onPageChange,
  port,
}) => {
  const [loadingEventId, setLoadingEventId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventIdToDelete, setEventIdToDelete] = useState(null);
  const [showNoEventsMessage, setShowNoEventsMessage] = useState(false);
  const navigate = useNavigate();
  console.log(events, "events");
  const handleEventDetails = (id) =>
    navigate(`/event-calendar-details?id=${id}`);
  const handleEditEvent = (id) => navigate(`/event-calendar-edit?id=${id}`);

  const handleDeleteEvent = async (id) => {
    setLoadingEventId(id);
    try {
      const response = await fetch(`/api/delete-event-calendar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ event_id: id }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Event deleted successfully!", { autoClose: 2000 });
        const updatedEvents = events?.filter((event) => event.event_id !== id);
        setEvents(updatedEvents);
      } else {
        toast.error(result.message || "Failed to delete event.", {
          autoClose: 2000,
        });
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setLoadingEventId(null);
      setIsModalOpen(false);
    }
  };

  const openDeleteModal = (id) => {
    setEventIdToDelete(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEventIdToDelete(null);
  };

  const capitalizeLocation = (location) =>
    location
      ? location.charAt(0).toUpperCase() + location.slice(1).toLowerCase()
      : location;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!events?.length) {
        setShowNoEventsMessage(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [events]);

  return (
    <div className="overflow-x-auto mx-auto max-w-5xl p-4">
      <ToastContainer />
      <div>
        {events?.length > 0 ? (
          <table className="w-full border-collapse bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-left">
                <th className="p-4 w-36">Event Image</th>
                <th className="p-4">Event Name</th>
                <th className="p-4">Event Date</th>
                <th className="p-4 w-36">Event Location</th>
                <th className="p-4">Event Description</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events?.map((event, index) => (
                <tr
                  key={index}
                  className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-300"
                >
                  <td className="p-4 w-32">
                    <img
                      className="w-32 h-20 rounded-2xl"
                      src={
                        event.image
                          ? `https://zocdoc-admin.onrender.com/uploads/${event.image}`
                          : '"https://fimacf.in/wp-content/uploads/2020/04/placeholder.png"'
                      }
                      alt="Profile"
                    />
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">
                    {capitalizeLocation(event.event_name) || "N/A"}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">
                    {new Date(event.event_date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">
                    {capitalizeLocation(event.event_location) || "N/A"}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: event.event_description,
                      }}
                    />
                  </td>
                  <td className="py-6 pr-4 flex justify-center gap-4">
                    <button
                      onClick={() => handleEventDetails(event.event_id)}
                      className="text-blue-500 hover:text-blue-700 cursor-pointer"
                    >
                      <IoEyeSharp />
                    </button>
                    <button
                      onClick={() => handleEditEvent(event.event_id)}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => openDeleteModal(event.event_id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      disabled={loadingEventId === event.event_id}
                    >
                      {loadingEventId === event.event_id ? (
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
        ) : showNoEventsMessage ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No event found.
          </p>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-t-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
            <p className="text-center text-gray-500 dark:text-gray-400">
              Loading events...
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        {totalPages > 1 && (
          <ReactPaginate
            previousLabel={"Previous"}
            nextLabel={"Next"}
            breakLabel={"..."}
            pageCount={totalPages}
            marginPagesDisplayed={2}
            pageRangeDisplayed={3}
            onPageChange={onPageChange}
            // containerClassName={"pagination"}
            // activeClassName={"active"}
            forcePage={currentPage - 1}
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

      <ConfirmDeleteModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleDeleteEvent}
        id={eventIdToDelete}
      />
    </div>
  );
};

export default EventTable;

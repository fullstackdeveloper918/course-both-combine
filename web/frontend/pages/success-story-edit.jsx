import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaArrowLeftLong } from "react-icons/fa6";
import ProgressBar from "../components/ProgressBar";

const UpdateSuccessStoryPage = () => {
  const [hover, setHover] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    video: null, // Store video file
    thumbnail: null, // Store thumbnail file
    story_id: null, // Keep story_id in the state
  });
  const [videoName, setVideoName] = useState(""); // Store the current video name
  const [thumbnailName, setThumbnailName] = useState(""); // Store the thumbnail name
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search); // Use window.location instead of location
  const storyId = searchParams.get("id");
  console.log("storyId", storyId);

  useEffect(() => {
    if (!storyId) return; // Ensure storyId is available

    const fetchStoryDetails = async () => {
      try {
        const response = await fetch(
          `/api/single-success-stories?story_id=${storyId}`
        );
        const result = await response.json();
        console.log(result, "fetchstorydetails");
        if (response.ok) {
          // Populate formData with the fetched story details
          setFormData({
            title: result?.data[0]?.title,
            content: result.data[0]?.content,
            story_id: result?.data[0]?.story_id,
            video: result?.data[0]?.video_url, // Assuming video_url is used for the video
            thumbnail: result?.data[0]?.thumbnail_url, // Assuming thumbnail_url is used for the thumbnail
          });
          setVideoName(getFilenameFromPath(result?.data[0]?.video_url)); // Set current video name
          setThumbnailName(getFilenameFromPath(result?.data[0]?.thumbnail_url)); // Set current thumbnail name
        } else {
          toast.error(result.message || "Failed to fetch story details.");
        }
      } catch (error) {
        toast.error("Failed to fetch story details.");
      }
    };

    fetchStoryDetails();
  }, [storyId]);

  // Function to extract the filename from the URL path
  const getFilenameFromPath = (filePath) => {
    const pathParts = filePath.split("/");
    return pathParts[pathParts.length - 1]; // Get the last part of the path
  };

  // Fetch users list on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users-list");
        const data = await response.json();
        setUsers(data); // Set users to state
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle video file input change
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    setFormData((prevData) => ({
      ...prevData,
      video: file, // Store video file object
    }));
    setVideoName(file.name); // Update video name when file is selected
  };

  // Handle thumbnail file input change
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    setFormData((prevData) => ({
      ...prevData,
      thumbnail: file, // Store thumbnail file object
    }));
    setThumbnailName(file.name); // Update thumbnail name when file is selected
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true); // Start loading

    // Create a FormData object to handle file upload
    const form = new FormData();
    form.append("title", formData.title);
    form.append("content", formData.content);
    form.append("story_id", formData.story_id); // Add story_id
    if (formData.video) {
      form.append("video", formData.video); // Append video file if it exists
    }
    if (formData.thumbnail) {
      form.append("image", formData.thumbnail); // Append thumbnail file if it exists
    }

    try {
      // Send the data to the API using fetch
      const response = await fetch(`/api/update-success-stories`, {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        throw new Error("Failed to update success story");
      }

      const data = await response.json();
      toast.success("Success story updated successfully!", { autoClose: 2000 });
      navigate("/success_stories");

      // Reset form
      setFormData({
        title: "",
        content: "",
        video: null,
        thumbnail: null,
        story_id: storyId, // Keep story_id intact
      });
      setVideoName(""); // Reset video name
      setThumbnailName(""); // Reset thumbnail name
    } catch (error) {
      toast.error("Error: " + error.message);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  if (!users)
    return (
      <>
        <ProgressBar data={users} />
      </>
    );

  return (
    <div className="pl-12">
      <button
        onClick={() => navigate(-1)}
        className="text-gray-500 cursor-pointer bg-gray-200 hover:text-gray-700 hover:bg-gray-400 px-2 py-2 mt-4 rounded-md"
      >
        <FaArrowLeftLong size={13} />
      </button>
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          margin: "20px auto",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <ToastContainer />
        <h2
          style={{
            textAlign: "center",
            fontSize: "24px",
            color: "#333",
            marginBottom: "20px",
          }}
        >
          Update Success Story
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="title"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#555",
                marginBottom: "5px",
              }}
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="content"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#555",
                marginBottom: "5px",
              }}
            >
              Content
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows="4"
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Video upload */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="video"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#555",
                marginBottom: "5px",
              }}
            >
              Video Upload
            </label>
            {videoName && (
              <p style={{ fontSize: "12px", color: "#555" }}>
                Current Video: {videoName} {/* Display only the filename */}
              </p>
            )}
            <input
              type="file"
              id="video"
              name="video"
              accept="video/*"
              onChange={handleVideoChange}
              style={{
                padding: "5px",
                fontSize: "14px",
                border: "1px solid gray",
              }}
            />
          </div>

          {/* Thumbnail upload */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="thumbnail"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#555",
                marginBottom: "5px",
              }}
            >
              Thumbnail Image
            </label>
            {thumbnailName && (
              <p style={{ fontSize: "12px", color: "#555" }}>
                Current Thumbnail: {thumbnailName}{" "}
                {/* Display only the filename */}
              </p>
            )}
            <input
              type="file"
              id="thumbnail"
              name="thumbnail"
              accept="image/*"
              onChange={handleThumbnailChange}
              style={{
                padding: "5px",
                fontSize: "14px",
                border: "1px solid gray",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              backgroundColor: hover ? "white" : "#F1F1F1",
              color: hover ? "gray" : "black",
              border: "1px solid gray",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background-color 0.3s ease, color 0.3s ease",
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            disabled={isLoading}
          >
            {isLoading ? "Updating Success Story..." : "Update Success Story"}{" "}
            {/* Conditionally render text */}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateSuccessStoryPage;

import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import ProgressBar from "../components/ProgressBar";

const Page = () => {
  const [searchParams] = useSearchParams(); // Correctly destructure useSearchParams
  const storyId = searchParams.get("id"); // Extract the `id` parameter
  console.log("storyId", storyId);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [storyDetails, setStoryDetails] = useState(null);
  const [isThumbnailVisible, setIsThumbnailVisible] = useState(true); // Track thumbnail visibility

  const port = localStorage.getItem("serverPort");
  console.log(port, "portt");

  useEffect(() => {
    if (!storyId) return; // Ensure storyId is available

    const fetchStoryDetails = async () => {
      try {
        const response = await fetch(`/api/single-success-stories?story_id=${storyId}`); // Correct query param
        const result = await response.json();

        if (response.ok) {
          setStoryDetails(result.data); // Access `data` field from the response
        } else {
          setError(result.message);
        }
      } catch (error) {
        setError("Failed to fetch story details.");
      }
    };

    fetchStoryDetails();
  }, [storyId]);

  console.log("storyDetails", storyDetails);

  if (error) return <div className="text-red-500">{error}</div>;
  if (!storyDetails) return <><ProgressBar data={storyDetails} /></>;

  const story = storyDetails[0]; // Assuming storyDetails is an array with one element

  // Toggle thumbnail visibility when clicked
  const handleThumbnailClick = () => {
    setIsThumbnailVisible(false);
  };

  return (
    <div className="pl-12">
      <button onClick={() => navigate(-1)} className="text-gray-500 cursor-pointer bg-gray-200 hover:text-gray-700 hover:bg-gray-400 px-2 py-2 mt-4 rounded-md">
        <FaArrowLeftLong size={13} />
      </button>

      <div className="max-w-md mt-8 mx-auto p-6 bg-white shadow-md rounded-lg flex flex-col gap-3 items-center justify-center">
        <p className="text-2xl font-bold mb-4"><strong>Success Story Details</strong></p>

        {/* Display Thumbnail Image */}
        {isThumbnailVisible && story.thumbnail_url ? (
          <div className="mb-4 relative w-full h-48" onClick={handleThumbnailClick}>
            <img
              src={`https://zocdoc-admin.onrender.com${story.thumbnail_url}`}
              alt="Thumbnail"
              className="w-full h-full object-cover rounded-md cursor-pointer"
            />
          </div>
        ) : null}

        {/* Display Video, shown only when thumbnail is clicked */}
        {!isThumbnailVisible && story.video_url ? (
          <div className="w-full h-48">
            <video width="448" height="340" controls>
              <source src={`https://zocdoc-admin.onrender.com${story.video_url}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        ) : null}

        <p className="mt-12"><strong>Title:</strong> {story.title}</p>
        <p><strong>Content:</strong> {story.content}</p>
      </div>
    </div>
  );
};

export default Page;

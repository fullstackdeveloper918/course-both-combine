import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import ProgressBar from "../components/ProgressBar";

const Page = () => {
  const [searchParams] = useSearchParams(); // Correctly destructure useSearchParams
  const postId = searchParams.get("id"); // Extract the `id` parameter
  console.log("postId", postId);
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postId) return; // Ensure userId is available

    const fetchPostDetails = async () => {
      try {
        const response = await fetch(`/api/single-post?post_id=${postId}`); // Correct query param
        const result = await response.json();

        if (response.ok) {
          setPost(result.data); // Access `data` field from the response
        } else {
          setError(result.message);
        }
      } catch (error) {
        setError("Failed to fetch post details.");
      }
    };

    fetchPostDetails();
  }, [postId]);

  if (error) return <div className="text-red-500">{error}</div>;
  // if (!post) return <div>Loading post details...</div>;
  if (!post)
    return (
      <>
        <ProgressBar data={post} />
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

      <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg flex gap-2 flex-col items-center">
        {/* <p className="text-4xl font-bold mb-4">User Details</p> */}
        <h2
          className="text-2xl font-bold mb-4 text-center"
          style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "7px" }}
        >
          Post Details
        </h2>
        <img
          className="w-80 h-40 object-cover rounded-md"
          src={
            post.image
              ? `https://zocdoc-admin.onrender.com/uploads/${post.image}`
              : "https://fimacf.in/wp-content/uploads/2020/04/placeholder.png"
          }
          alt="post"
        />
        <div className="flex flex-col items-left w-full gap-2 ml-20">
          <p className="text-left">
            <strong>Username:</strong> {post.author}
          </p>
          <p>
            <strong>Title:</strong> {post.title || "N/A"}
          </p>
          <p>
            <strong>Content:</strong>{" "}
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </p>
          <p>
            <strong>Thread Title:</strong> {post.thread_title}
          </p>
          <p>
            <strong>Category Name:</strong> {post.category_name}
          </p>
          <p>
            <strong>Tag Name:</strong> {post.tag_name}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page;

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PostTable from "../components/PostTable";

export default function PageName() {
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNoPostsMessage, setShowNoPostsMessage] = useState(false);

  const fetchPosts = async (page = 1, search = "") => {
    try {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set("page", page);
      if (search) searchParams.set("postname", search);

      const response = await fetch(`/api/get-post?${searchParams.toString()}`);
      const result = await response.json();

      if (result.status === 200) {
        setPost(result); // Ensure to update state with result.data
        setShowNoPostsMessage(false);
      } else {
        setPost(null);
        setShowNoPostsMessage(true);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handleAddUsers = () => {
    navigate("/add-post");
  };

  // Fetch posts when searchTerm changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const currentPage = parseInt(queryParams.get("page")) || 1;
    const search = queryParams.get("postname") || "";
    setSearchTerm(search);

    // Trigger fetching posts as searchTerm changes
    const delayFetch = setTimeout(() => {
      fetchPosts(currentPage, searchTerm);
    }, 300); // Adjust debounce delay as needed (300ms is common)

    return () => clearTimeout(delayFetch);
  }, [location.search, searchTerm]); // Trigger when searchTerm changes

  return (
    <div className="w-full">
      <div className="sticky w-full top-0 bg-[#f1f2f4] z-10 flex justify-between items-center py-4 px-8 shadow flex-wrap">
        <h1 className="text-2xl font-semibold text-center sm:text-left" style={{ fontSize: "23px", fontWeight: "500", width:"277px" }}>
          Posts
        </h1>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-between sm:justify-start">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);

              const searchParams = new URLSearchParams(location.search);
              if (e.target.value) {
                searchParams.set("postname", e.target.value);
              } else {
                searchParams.delete("postname");
              }
              searchParams.set("page", 1);
              navigate(`?${searchParams.toString()}`);
            }}
            placeholder="Search posts title..."
            className="px-2 py-1 border rounded w-full sm:w-80"
          />
          <button
            onClick={handleAddUsers}
            className="mt-4 sm:mt-0 px-4 py-1 cursor-pointer bg-[#ffffff] text-black font-semibold rounded-xl w-full sm:w-auto"
          >
            Add Post
          </button>
        </div>
      </div>

      {/* Render posts */}
      {showNoPostsMessage ? (
        <p>No posts found</p>
      ) : (
        <PostTable post={post} setPost={setPost} />
      )}
    </div>
  );
}

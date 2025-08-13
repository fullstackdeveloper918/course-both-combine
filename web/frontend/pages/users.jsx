import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserTable from "../components/UserTable";
import ProgressBar from "../components/ProgressBar"; // Assuming you have a ProgressBar component

export default function UsersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [port, setPort] = useState();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNoUsersMessage, setShowNoUsersMessage] = useState(false);
  const [loading, setLoading] = useState(false); // Adding loading state

  const fetchUsers = async (page = 1, search = "") => {
    setLoading(true); // Start loading
    try {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set("page", page);
      if (search) searchParams.set("username", search);

      const response = await fetch(
        `/api/users-list?${searchParams.toString()}`
      );
      const result = await response.json();

      if (result.status === 200) {
        setUsers(result);
        setShowNoUsersMessage(false);
        if (result?.PORT) {
          localStorage.setItem("serverPort", result.PORT);
          setPort(result?.PORT);
        }
      } else {
        setUsers(null);
        setShowNoUsersMessage(true);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false); // Stop loading once fetch is complete
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const currentPage = parseInt(queryParams.get("page")) || 1;
    const search = queryParams.get("username") || "";
    setSearchTerm(search);

    const delayFetch = setTimeout(() => {
      fetchUsers(currentPage, searchTerm);
    }, 300);

    return () => clearTimeout(delayFetch);
  }, [location.search, searchTerm]);

  const handleAddUsers = () => {
    navigate("/add-user");
  };

  // If loading, show the progress bar
  // if (loading) {
  //   return <ProgressBar data={users} />; // Show progress bar while loading
  // }

  return (
    <div className="w-full">
      <div className="sticky w-full top-0 bg-[#f1f2f4] z-10 flex justify-between items-center py-4 px-8 shadow flex-wrap">
        <h1
          className="text-2xl font-semibold text-center sm:text-left"
          style={{ fontSize: "23px", fontWeight: "500", width: "277px" }}
        >
          Users
        </h1>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-between sm:justify-start">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);

              const searchParams = new URLSearchParams(location.search);
              if (e.target.value) {
                searchParams.set("username", e.target.value);
              } else {
                searchParams.delete("username");
              }
              searchParams.set("page", 1);
              navigate(`?${searchParams.toString()}`);
            }}
            placeholder="Search users..."
            className="px-2 py-1 border rounded w-full sm:w-80"
          />
          <button
            onClick={handleAddUsers}
            className="mt-4 sm:mt-0 px-4 py-1 cursor-pointer bg-[#ffffff] text-black font-semibold rounded-xl w-full sm:w-auto"
          >
            Add User
          </button>
        </div>
      </div>

      {showNoUsersMessage ? (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-20">
          No user found.
        </p>
      ) : (
        <UserTable users={users} setUsers={setUsers} port={port} />
      )}
    </div>
  );
}

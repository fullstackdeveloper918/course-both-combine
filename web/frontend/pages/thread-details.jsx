import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import ProgressBar from "../components/ProgressBar";

const Page = () => {
    const [searchParams] = useSearchParams(); // Correctly destructure useSearchParams
    const threadId = searchParams.get("id"); // Extract the `id` parameter
    console.log("threadId", threadId);
    const navigate = useNavigate();
    const [thread, setthread] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!threadId) return; // Ensure userId is available

        const fetchthreadDetails = async () => {
            try {
                const response = await fetch(`/api/single-threads?thread_id=${threadId}`); // Correct query param
                const result = await response.json();

                if (response.ok) {
                    setthread(result?.data); // Access `data` field from the response
                } else {
                    setError(result.message);
                }
            } catch (error) {
                setError("Failed to fetch thread details.");
            }
        };

        fetchthreadDetails();
    }, [threadId]);

    if (error) return <div className="text-red-500">{error}</div>;
    // if (!thread) return <div>Loading thread details...</div>;
    if (!thread) return <><ProgressBar data={thread} /></>

    return (
        <div className="pl-12">
           <button onClick={() => navigate(-1)} className="text-gray-500 cursor-pointer bg-gray-200 hover:text-gray-700 hover:bg-gray-400 px-2 py-2 mt-4 rounded-md">
                <FaArrowLeftLong size={13} />
            </button>

            <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg flex gap-2 flex-col items-left">
                {/* <p className="text-4xl font-bold mb-4">User Details</p> */}
                <h2 className="text-2xl font-bold mb-4 text-center mb-2" style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "7px" }}>thread Details</h2>

                <p><strong>Title:</strong> {thread?.title}</p>
                <p><strong>Content:</strong> {thread?.content}</p>
                <p><strong>Category:</strong> {thread?.category_name === null ? "N/A" :thread?.category_name }</p>
                <p><strong>User:</strong> {thread?.username}</p>
            </div>
        </div>
    );
};

export default Page;

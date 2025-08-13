import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import { CgLayoutGrid } from "react-icons/cg";
import ProgressBar from "../components/ProgressBar";

const Page = () => {
  const [searchParams] = useSearchParams();
  const resourceId = searchParams.get("id");
  console.log("resourceId", resourceId);

  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!resourceId) return;

    const fetchResourceDetails = async () => {
      try {
        const response = await fetch(`/api/single-resource-library?resource_id=${resourceId}`);
        const result = await response.json();
        console.log("API Response:", result);

        if (response.ok) {
          setResource(result?.data);
          console.log("Resource set:", result?.data);
        } else {
          setError(result?.message);
          console.error("API Error:", result?.message);
        }
      } catch (error) {
        setError("Failed to fetch resource details.");
        console.error("Fetch Error:", error);
      }
    };

    fetchResourceDetails();
  }, [resourceId]);

  if (error) return <div className="text-red-500">{error}</div>;
  // if (!resource) return <div>Loading resource details...</div>;
  if (!resource) return <><ProgressBar data={resource} /></>;
  return (
    <div className="pl-12">
      <button onClick={() => navigate(-1)} className="text-gray-500 cursor-pointer bg-gray-200 hover:text-gray-700 hover:bg-gray-400 px-2 py-2 mt-4 rounded-md">
        <FaArrowLeftLong size={13} />
      </button>
      <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg flex gap-2 flex-col items-left">
        <h2 className="text-2xl font-bold mb-4 text-center mb-2" style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "7px" }}>Resource Details</h2>
        <p><strong>Title:</strong> {resource.title}</p>
        <p><strong>Content:</strong> {resource.content}</p>
        <p><strong>Resource Type:</strong> {resource.resource_type}</p>
      </div>
    </div>
  );
};

export default Page;
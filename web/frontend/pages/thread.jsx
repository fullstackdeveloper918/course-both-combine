import { useEffect, useState } from "react";
import {
  Page,
  Layout,
} from "@shopify/polaris";

import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import ThreadTable from "../components/ThreadTable";
import queryString from "query-string";

export default function PageName() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [thread, setThread] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const { page = 1, search = "" } = queryString.parse(location.search);
    setCurrentPage(Number(page));
    setSearch(search);
  }, [location.search]);

  useEffect(() => {
    const fetchThread = async () => {
      try {
        const response = await fetch(`/api/get-threads?page=${currentPage}&search=${search}`);
        const data = await response.json();
        setThread(data);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error("Error fetching threads:", error);
      }
    };

    fetchThread();
  }, [currentPage, search]);

  const handleAddThread = () => {
    navigate("/add-thread");
  };

  const handlePageChange = ({ selected }) => {
    const newPage = selected + 1;
    const query = queryString.stringify({ page: newPage, search });
    navigate(`?${query}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = queryString.stringify({ page: 1, search });
    navigate(`?${query}`);
  };

  return (
    <div className="w-full">
      <div className="sticky w-full top-0 bg-[#f1f2f4] z-10 flex justify-between items-center py-4 px-8 shadow flex-wrap">
        <h1 className="text-2xl font-semibold text-center sm:text-left" style={{ fontSize: "23px", fontWeight: "500", width: "277px"  }}>
          Thread
        </h1>

        <div className="flex items-center space-x-4 mt-4 sm:mt-0 flex-wrap sm:flex-nowrap">
          <form onSubmit={handleSearch} className="flex items-center w-full sm:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search threads..."
              className="px-2 py-1 border rounded w-full sm:w-80"
            />
          </form>
          <button
            onClick={handleAddThread}
            className="mt-4 sm:mt-0 px-4 py-1 cursor-pointer bg-[#ffffff] text-black font-semibold rounded-xl w-full sm:w-40">
            Add Thread
          </button>
        </div>
      </div>


      <ThreadTable
        thread={thread}
        setThread={setThread}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

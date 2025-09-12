"use client";

import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import Hls from "hls.js";
import { jwtDecode } from "jwt-decode";

export default function LessonViewPage() {
  const [lesson, setLesson] = useState(null);
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [moduleId, setModuleId] = useState(null);
  const [lessonId, setLessonId] = useState(null);
  const [loading, setLoading] = useState();
  const [error, setError] = useState(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const videoRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const courseId = params.get("id");
    const moduleId = params.get("moduleId");
    const lessonId = params.get("lessonId");

    setCourseId(courseId);
    setModuleId(moduleId);
    setLessonId(lessonId);
    loadLessons(lessonId);
  }, [location.search]);

  async function loadLessons(lessonId) {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error("Failed to load courses");
      }
      const data = await response.json();
      setLesson(data?.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!lesson || !videoRef.current) {
      setVideoLoading(false);
      return;
    }

    // Reset video states
    setVideoLoading(true);
    setVideoError(null);

    // If no video URL, set loading to false and return
    if (!lesson.videoUrl) {
      setVideoLoading(false);
      return;
    }

    let videoUrl = lesson.videoUrl;
    let hls = null;

    try {
      // Optional: If it's a JWT, decode it
      if (videoUrl.includes(".")) {
        const decoded = jwtDecode(videoUrl);
        if (decoded?.url) {
          videoUrl = decoded.url;
        }
      }

      console.log("Final video URL:", videoUrl);

      // Setup video event listeners
      const videoElement = videoRef.current;

      const handleCanPlay = () => {
        setVideoLoading(false);
        setVideoError(null);
      };

      const handleError = (e) => {
        console.error("Video error:", e);
        setVideoLoading(false);
        setVideoError("Failed to load video. Please try again later.");
      };

      videoElement.addEventListener("canplay", handleCanPlay);
      videoElement.addEventListener("error", handleError);

      // Initialize HLS player
      if (Hls.isSupported()) {
        hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });

        hls.loadSource(videoUrl);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log("HLS media attached");
        });

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          console.log(
            "HLS manifest parsed, quality levels:",
            data.levels.length
          );
          setVideoLoading(false);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS error:", data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setVideoError("Network error occurred while loading video.");
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setVideoError("Media error occurred. Please try again.");
                break;
              default:
                setVideoError("An error occurred while loading the video.");
            }
            setVideoLoading(false);
          }
        });
      } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        videoElement.src = videoUrl;
      } else {
        setVideoError("Your browser does not support video streaming.");
        setVideoLoading(false);
      }

      // Cleanup function
      return () => {
        if (hls) {
          hls.destroy();
        }
        if (videoElement) {
          videoElement.removeEventListener("canplay", handleCanPlay);
          videoElement.removeEventListener("error", handleError);
        }
      };
    } catch (error) {
      console.error("Error setting up video player:", error);
      setVideoError("Failed to initialize video player.");
      setVideoLoading(false);
    }
  }, [lesson]);

  console.log(videoRef, "reff here to see data");

  if (!lesson) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Lesson not found
              </h3>
              <Button
                onClick={() => navigate("/courses")}
                className="text-white bg-purple-600 hover:bg-purple-700"
              >
                Back to Courses
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      <div className="flex-1 p-6">
        <div className="max-w-8xl">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() =>
                navigate(`/lessons?id=${courseId}&moduleId=${moduleId}`)
              }
              className="mr-4 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lessons
            </Button>
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-1">
                {course?.title} → {module?.title}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {lesson.title}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-black rounded-t-lg overflow-hidden relative">
                    {videoLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
                        <div className="text-center text-white">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                          <p className="text-lg">Loading video...</p>
                        </div>
                      </div>
                    )}

                    {videoError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
                        <div className="text-center text-white p-6">
                          <div className="text-6xl mb-4">⚠️</div>
                          <h3 className="text-xl font-semibold mb-2">
                            Video Error
                          </h3>
                          <p className="text-gray-300 mb-4">{videoError}</p>
                          <button
                            onClick={() => window.location.reload()}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    )}

                    {!lesson.videoUrl && !videoLoading && !videoError && (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="text-center text-white p-8">
                          <div className="text-6xl mb-4">📚</div>
                          <h3 className="text-2xl font-semibold mb-2">
                            No Video Available
                          </h3>
                          <p className="text-gray-300 mb-4 max-w-md">
                            This lesson doesn't include a video. You can still
                            access the lesson content and materials below.
                          </p>
                          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Lesson content ready</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {lesson.videoUrl && !videoError && (
                      <video
                        ref={videoRef}
                        controls
                        className="w-full h-full"
                        preload="metadata"
                      />
                    )}
                  </div>

                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {lesson.title}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      {lesson.duration && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {lesson.duration}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(lesson.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {lesson.description ||
                          "No description available for this lesson."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lesson Info Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lesson Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Course</h4>
                    <p className="text-sm text-gray-600">{course?.title}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Module</h4>
                    <p className="text-sm text-gray-600">{module?.title}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Duration</h4>
                    <p className="text-sm text-gray-600">
                      {lesson.duration || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Created</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(lesson.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

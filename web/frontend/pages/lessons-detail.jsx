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
  if (!lesson?.videoUrl || !videoRef.current) return;

  let videoUrl = lesson.videoUrl;

  try {
    // Optional: If it's a JWT, decode it
    if (videoUrl.includes(".")) {
      const decoded = jwtDecode(videoUrl);
      if (decoded?.url) {
        videoUrl = decoded.url;
        // videoUrl ="https://vz-3b1984a4-21d.b-cdn.net/687c880c-1837-4e6f-bba5-b3ef59ff85a8/playlist.m3u8"
      }
    }

    console.log("Final video URL:", videoUrl);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.ERROR, function (event, data) {
        console.error("HLS error:", data);
      });

      return () => hls.destroy();
    } else if (
      videoRef.current.canPlayType("application/vnd.apple.mpegurl")
    ) {
      videoRef.current.src = videoUrl;
    } else {
      console.error("This browser does not support HLS.");
    }
  } catch (error) {
    console.error("Error decoding video token or setting up HLS:", error);
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
                  <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                    {lesson.videoUrl ? (
                      <video
                        ref={videoRef}
                        controls
                        autoPlay
                        muted
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white">
                        <div className="text-center">
                          <div className="text-6xl mb-4">📹</div>
                          <p>No video available</p>
                        </div>
                      </div>
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

"use client";

import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Image, Text } from "@shopify/polaris";
import Hls from "hls.js";
import ReactPlayer from "react-player";

export default function CoursePage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const courseId = params.get("id");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [courseData, setCourseData] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expandedModules, setExpandedModules] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(false); // Top level

  
// useEffect(() => {
//   document.addEventListener('contextmenu', (e) => e.preventDefault());
//   return () => document.removeEventListener('contextmenu', (e) => e.preventDefault());
// }, []);


// useEffect(() => {
//   const handler = (e) => {
//     if (
//       (e.ctrlKey && e.key === 's') || // Save
//       (e.ctrlKey && e.key === 'u') || // View Source
//       (e.key === 'F12') || // Dev Tools
//       (e.ctrlKey && e.shiftKey && e.key === 'I')
//     ) {
//       e.preventDefault();
//     }
//   };
//   document.addEventListener('keydown', handler);
//   return () => document.removeEventListener('keydown', handler);
// }, []);




  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    if (courseData && courseData.modules.length > 0) {
      setState(true);
      // Set first lesson as current and expand first module
      const firstModule = courseData.modules[0];
      if (firstModule.lessons.length > 0) {
        setCurrentLesson(firstModule.lessons[0]);
        setExpandedModules([firstModule.id]);
      }
    }
  }, [courseData]);

  const fetchCourseData = async () => {
    try {
      const response = await fetch(
        `https://mentioned-micro-cohen-offers.trycloudflare.com/api/frontend/courses/${courseId}`
      );
      const result = await response.json();
      if (result.success) {
        console.log(result.data,"result data show me")
        setCourseData(result.data);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
    } finally { 
      setLoading(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    const videoUrl =
      "https://iframe.mediadelivery.net/play/474946/687c880c-1837-4e6f-bba5-b3ef59ff85a8";

    let hls;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play();
      });
    }

    const renderFrame = () => {
      if (video.paused || video.ended) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(renderFrame);
    };

    video.addEventListener("play", renderFrame);

    return () => {
      video.removeEventListener("play", renderFrame);
      if (hls) hls.destroy();
    };
  }, [currentLesson]);

  const handleTimeUpdate = () => {
    // For iframe videos, time tracking needs to be handled differently
    // This would require postMessage API communication with the video player
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };


  const handlePlay = () => {
    setIsPlaying(true);
    console.log(`Video playing - iframe video`);
  };

  const handleLessonSelect = (lesson) => {
    setCurrentLesson(lesson);
    setCurrentTime(0);
    setIsPlaying(false);

    setTimeout(() => {
      const savedTime = localStorage.getItem(`lesson_${lesson.id}_time`);
      if (savedTime && videoRef.current) {
        videoRef.current.currentTime = Number.parseFloat(savedTime);
      }
    }, 100);
  };

  const toggleModuleExpansion = (moduleId) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const markLessonComplete = (lessonId) => {
    setCompletedLessons((prev) =>
      prev.includes(lessonId) ? prev : [...prev, lessonId]
    );
  };

  const formatTime = (seconds) => {
    console.log(seconds, "seconds egt");
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data || typeof event.data !== "object") return;

      const { eventType, currentTime } = event.data;

      if (eventType === "pause") {
        // Call the function to send progress
        sendProgressUpdate(currentTime);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const sendProgressUpdate = async (lastPosition) => {
    const userId = "your-user-id"; // Replace with actual logged-in user ID
    const lessonId = currentLesson?.id;
    const moduleId = courseData?.modules.find((m) =>
      m.lessons.some((l) => l.id === lessonId)
    )?.id;

    const payload = {
      userId,
      lessonId,
      courseId,
      moduleId,
      status: "paused",
      progress: Math.round((lastPosition / currentLesson?.duration) * 100),
      lastPosition,
    };

    try {
      const response = await fetch(
        "https://ellen-bikes-rec-lady.trycloudflare.com/api/frontend/courses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log("Progress sent:", result);
    } catch (error) {
      console.error("Failed to send progress:", error);
    }
  };

  const calculateProgress = () => {
    if (!courseData) return 0;
    const totalLessons = courseData.modules.reduce(
      (acc, module) => acc + module.lessons.length,
      0
    );
    return totalLessons > 0
      ? (completedLessons.length / totalLessons) * 100
      : 0;
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <Text variant="bodyMd">Loading course content...</Text>
      </div>
    );
  }

  if (!courseData || !currentLesson) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <Text variant="bodyMd">Course not found or no lessons available.</Text>
      </div>
    );
  }

  console.log(videoRef.current,"videoRef see new")
// useEffect(() => {
//   const handlePause = () => {
//     const currentTime = videoRef.current?.getCurrentTime?.();
//     console.log('Video paused at:', currentTime);

//     fetch("/api/video-pause", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ pausedAt: currentTime }),
//     });
//   };

//   // Call handlePause on mount or when videoRef.current becomes available
//   if (videoRef.current?.getCurrentTime) {
//     handlePause();
//   }
// }, [videoRef.current]);


  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f6f6f7" }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "white",
          padding: "1rem 2rem",
          borderBottom: "1px solid #e1e3e5",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <button
          onClick={() => window.history.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#008060",
            fontSize: "14px",
          }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0 }}>
          {courseData.title}
        </h1>
      </div>

      <div style={{ display: "flex", padding: "2rem", gap: "2rem" }}>
        {/* Main Content - Left Side */}
        <div
          style={{
            flex: "0 0 60%",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {/* Video Player */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
              }}
            >
         
              <iframe
                ref={videoRef}
                src={currentLesson.videoUrl}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                  backgroundColor: "#000",
                  // display:"none"
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen

                key={currentLesson.id}
              />
              {/* <canvas ref={videoRef} width={1280} height={720} /> */}
            </div>
          </div>

          {/* Lesson Info */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1rem",
              }}
            >
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", margin: 0 }}>
                {currentLesson.title}
              </h2>
              <button
                onClick={() => markLessonComplete(currentLesson.id)}
                disabled={completedLessons.includes(currentLesson.id)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: completedLessons.includes(currentLesson.id)
                    ? "#10b981"
                    : "white",
                  color: completedLessons.includes(currentLesson.id)
                    ? "white"
                    : "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: completedLessons.includes(currentLesson.id)
                    ? "default"
                    : "pointer",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {completedLessons.includes(currentLesson.id) ? "✓ " : "○ "}
                Mark Complete
              </button>
            </div>

            <p
              style={{
                color: "#6b7280",
                marginBottom: "1rem",
                lineHeight: "1.6",
                fontSize: "0.875rem",
              }}
            >
              {currentLesson.description}
            </p>

            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                marginBottom: "1rem",
                fontSize: "0.875rem",
                color: "#6b7280",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span>🕒</span>
                <span>{formatTime(currentLesson.duration)}</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span>👥</span>
                <span>32,543 students</span>
              </div>
              <div
                style={{
                  backgroundColor: "#dbeafe",
                  color: "#1e40af",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                ⭐ 4.8
              </div>
            </div>

            {/* Course Progress */}
            <div>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                }}
              >
                Course Progress
              </p>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: "#e5e7eb",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${calculateProgress()}%`,
                    height: "100%",
                    backgroundColor: "#008060",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                {Math.round(calculateProgress())}% Complete
              </p>
            </div>
          </div>

          {/* Instructor Info */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "#008060",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "1.5rem",
                  fontWeight: "600",
                }}
              >
                👤
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    margin: "0 0 0.25rem 0",
                  }}
                >
                  John Smith
                </h3>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    margin: "0 0 0.5rem 0",
                  }}
                >
                  Senior Full Stack Developer
                </p>
                <div
                  style={{ display: "flex", gap: "1rem", alignItems: "center" }}
                >
                  <div
                    style={{
                      backgroundColor: "#fef3c7",
                      color: "#d97706",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                    }}
                  >
                    ⭐ 4.9
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    👥 32,543 Students
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Resources */}
          {currentLesson.files && currentLesson.files.length > 0 && (
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <span>📥</span>
                <h3
                  style={{ fontSize: "1.1rem", fontWeight: "600", margin: 0 }}
                >
                  Lesson Resources
                </h3>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {currentLesson.files.map((file) => (
                  <div
                    key={file.id}
                    style={{
                      padding: "1rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <span style={{ fontSize: "1.25rem" }}>📄</span>
                      <div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            margin: "0 0 0.25rem 0",
                          }}
                        >
                          {file.name || "Course Resource"}
                        </p>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            margin: 0,
                          }}
                        >
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(file.url, "_blank")}
                      disabled={!file.isDownloadable}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: file.isDownloadable
                          ? "#008060"
                          : "#e5e7eb",
                        color: file.isDownloadable ? "white" : "#9ca3af",
                        border: "none",
                        borderRadius: "6px",
                        cursor: file.isDownloadable ? "pointer" : "not-allowed",
                        fontSize: "0.875rem",
                      }}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>

              <button
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "#1f2937",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginTop: "1rem",
                }}
                onClick={() => {
                  currentLesson.files.forEach((file) => {
                    if (file.isDownloadable) {
                      window.open(file.url, "_blank");
                    }
                  });
                }}
              >
                📥 Download All Course Resources
              </button>
            </div>
          )}
        </div>

        {/* Sidebar - Right Side */}
        <div style={{ width: "800px", flexShrink: 0 }}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            {/* Course Content Header */}
            <div style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span>📚</span>
                <h3
                  style={{ fontSize: "1.1rem", fontWeight: "600", margin: 0 }}
                >
                  Course Content
                </h3>
              </div>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "0.875rem",
                  margin: "0 0 1rem 0",
                }}
              >
                {courseData.modules.reduce(
                  (acc, module) => acc + module.lessons.length,
                  0
                )}{" "}
                lessons • {Math.floor(courseData.totalDuration / 60)} hours
              </p>

              {/* Progress Bar */}
              <div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    marginBottom: "0.5rem",
                  }}
                >
                  Course Progress
                </p>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${calculateProgress()}%`,
                      height: "100%",
                      backgroundColor: "#008060",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    marginTop: "0.25rem",
                  }}
                >
                  {Math.round(calculateProgress())}% Complete
                </p>
              </div>
            </div>

            {/* Modules List */}
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {courseData.modules.map((module) => (
                <div key={module.id}>
                  <div
                    style={{
                      padding: "1rem 1.5rem",
                      cursor: "pointer",
                      borderTop: "1px solid #e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    onClick={() => toggleModuleExpansion(module.id)}
                  >
                    {console.log(module, "module ")}
                    <div>
                      <h4
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          margin: "0 0 0.25rem 0",
                        }}
                      >
                        {module.title}
                      </h4>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          margin: 0,
                        }}
                      >
                        {module.lessons.length} lessons
                      </p>
                    </div>
                    <span style={{ fontSize: "1rem" }}>
                      {expandedModules.includes(module.id) ? "▼" : "▶"}
                    </span>
                  </div>

                  {/* Lessons */}
                  {expandedModules.includes(module.id) && (
                    <div>
                      {module.lessons.map((lesson) => (
                        <>
                          <div
                            key={lesson.id}
                            style={{
                              padding: "0.75rem 1.5rem 0.75rem 3rem",
                              cursor: "pointer",
                              backgroundColor:
                                currentLesson.id === lesson.id
                                  ? "#f0fdf4"
                                  : "transparent",
                              borderLeft:
                                currentLesson.id === lesson.id
                                  ? "3px solid #008060"
                                  : "3px solid transparent",
                              display: "flex",
                              alignItems: "start",
                              gap: "0.75rem",
                              flexDirection: "column",
                            }}
                            onClick={() => handleLessonSelect(lesson)}
                          >
                            <div
                              className="w-100"
                              style={{
                                // padding: "0.75rem 1.5rem 0.75rem 3rem",
                                cursor: "pointer",
                                backgroundColor:
                                  currentLesson.id === lesson.id
                                    ? "#f0fdf4"
                                    : "transparent",
                                display: "flex",
                                alignItems: "start",
                                gap: "0.75rem",
                                width:"100%",
                                justifyContent: "center",
                                // flexDirection:"column"
                              }}
                            >
                              <span style={{ fontSize: "0.875rem" }}>
                                <Image
                                  height={100}
                                  style={{ borderRadius: "10px" }}
                                  width={150}
                                  src={lesson.thumbnail}
                                />
                                <div
                                  style={{
                                    width: "100%",
                                    height: "6px",
                                    backgroundColor: "#e5e7eb",
                                    borderRadius: "4px",
                                    // overflow: "hidden",
                                    marginTop: "-6.2px",
                                    position: "relative",
                                    zIndex: "999",
                                    borderRadius: "10px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${calculateProgress()}%`,
                                      height: "100%",
                                      backgroundColor: "red",
                                      transition: "width 0.3s ease",
                                    }}
                                  />
                                </div>

                                {/* {completedLessons.includes(lesson.id) ? "✅" : "▶️"} */}
                              </span>

                              <div style={{ flex: 1 }}>
                                <p
                                  style={{
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                    margin: "0 0 0.25rem 0",
                                  }}
                                >
                                  {lesson.title}
                                </p>

                                <p
                                  style={{
                                    fontSize: "0.875rem",
                                    fontWeight: "400",
                                    margin: "0 0 0.25rem 0",
                                  }}
                                >
                                  {lesson.content}
                                </p>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                  }}
                                >
                                  <span style={{ fontSize: "0.75rem" }}>
                                    🕒
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#6b7280",
                                    }}
                                  >
                                    {formatTime(lesson.duration)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

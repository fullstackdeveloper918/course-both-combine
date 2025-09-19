import {
  reactExtension,
  Text,
  BlockStack,
  ResourceItem,
  Image,
  Heading,
  Page,
  Grid,
  GridItem,
  useAuthenticatedAccountCustomer,
  useShop,
  useApi,
  TextBlock,
  View,
  Card,
  InlineStack,
  Badge,
  Button,
} from "@shopify/ui-extensions-react/customer-account";
import React, { useEffect, useState } from "react";

export default reactExtension("customer-account.page.render", () => (
  <Wishlists />
));

function Wishlists() {
  const authenticatedCustomer = useAuthenticatedAccountCustomer();
  const api = useApi();
  // const token = await api.sessionToken.get();
  // console.log("token...", token);

  const scriptUrl = api.extension.scriptUrl;
  if (!scriptUrl) {
    return <Text>Script URL not found</Text>;
  }
  if (!authenticatedCustomer.id) {
    return <Text>Please login to view Courses</Text>;
  }

  const storeDomain = scriptUrl.split("/extensions")[0];
  console.log("storeDomain...", storeDomain);

  console.log("authenticatedCustomer...", authenticatedCustomer);

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [error, setError] = useState("");
  const [progressMap, setProgressMap] = useState({});
  const [lastPosition, setLastPosition] = useState(0);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const [videoPlayerStatus, setVideoPlayerStatus] = useState(null);

  // Fetch modules for a specific course
  const getModulesForCourse = async (courseId) => {
    try {
      setLoadingModules(true);
      console.log("Fetching modules for course:", courseId);

      const response = await fetch(
        `${storeDomain}/api/frontend/modules/getallmodulesofcourse/${courseId}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();
      console.log("Modules data:", data);

      if (data.success && data.data) {
        return data.data;
      } else {
        console.error("Failed to fetch modules:", data);
        return [];
      }
    } catch (err) {
      console.error("Error fetching modules:", err);
      return [];
    } finally {
      setLoadingModules(false);
    }
  };

  // Handle course selection and fetch its modules
  const handleCourseSelect = async (course) => {
    const modules = await getModulesForCourse(course.id);
    const courseWithModules = {
      ...course,
      modules: modules,
    };
    setSelectedCourse(courseWithModules);
    // Auto-expand first module
    if (modules.length > 0) {
      setExpandedModules({ [modules[0].id]: true });
    }
  };

  // Handle module selection to view lessons
  const handleModuleSelect = (module) => {
    console.log("Selecting module for lesson view:", module);
    setSelectedModule(module);
  };

  // Handle lesson selection to view lesson details
  const handleLessonSelect = async (lesson) => {
    try {
      setLoadingLesson(true);
      console.log("Fetching lesson details for:", lesson.id);

      const response = await fetch(
        `${storeDomain}/api/frontend/lessons/getlesson/${lesson.id}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();
      console.log("Lesson data:", data);

      if (data.success && data.data) {
        console.log("Lesson loaded successfully:", data.data);
        setSelectedLesson(data.data);
      } else {
        console.error("Failed to fetch lesson:", data);
        setError("Failed to load lesson details");
      }
    } catch (err) {
      console.error("Error fetching lesson:", err);
      setError("Failed to load lesson details");
    } finally {
      setLoadingLesson(false);
    }
  };

  // Toggle module expansion
  const toggleModule = (moduleId) => {
    console.log("Toggling module:", moduleId);
    const module = selectedCourse.modules.find((m) => m.id === moduleId);
    console.log("Module found:", module);
    console.log("Module lessons:", module?.lessons);

    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // return the courses of the authenticated customer
  const getcourseDetails = async () => {
    try {
      console.log("getcourseDetails run 1...");

      const response = await fetch(
        `${storeDomain}/api/frontend/courses/getAllcourses/${authenticatedCustomer.id}`,
        {
          method: "GET",
        }
      );
      console.log("getcourseDetails run 2...");

      const data = await response.json();
      console.log("data 11...", data);

      if (data && Array.isArray(data)) {
        console.log("data...", data);

        setCourses(data);

        const progressData = {};

        for (const course of data) {
          try {
            console.log("progress fethced runnuing....");

            const res = await fetch(
              `${storeDomain}/api/frontend/progress/courseprogress/${authenticatedCustomer.id}/${course.id}`
            );
            const result = await res.json();
            console.log("result..", result);

            if (result.success) {
              progressData[course.id] = result?.data?.averageProgress ?? 0;
            }
          } catch (err) {
            console.warn(
              `Failed to fetch progress for course ${course.id}`,
              err
            );
          }
        }

        setProgressMap(progressData);
      } else {
        setError("No courses found.");
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses.");
    }
  };

  useEffect(() => {
    console.log("useEffect run...");
    const fetchData = async () => {
      await getcourseDetails();
    };

    fetchData();
  }, []);

  if (!authenticatedCustomer) {
    return <Text>Please login to view Courses</Text>;
  }
  // if (loading) {
  //   return <Text>Loading...</Text>;
  // }
  const token =
    "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0ZXN0aW5nYXBwc3N0b3JlLWQubXlzaG9waWZ5LmNvbSIsImF1ZCI6InRlc3RpbmdhcHBzc3RvcmUtZC5teXNob3BpZnkuY29tIiwibmJmIjoxNzUzNDM4NTk4LCJjaGVja291dF9wcm9maWxlX2lkIjoyMzE5MTIyNTExLCJjaGVja291dF9wcm9maWxlX3B1Ymxpc2hlZCI6dHJ1ZSwidXNlcl9pZCI6ODE2NzE3ODI0NzksImV4cCI6MTc1MzQ0MjE5OH0.DChkjhim3ijHGV7R4RFFlDQg3MkToy4U9F1bcu7t0YA";

  function decodeJwt(token) {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  }

  // Decode JWT token to get HLS URL
  const decodeVideoToken = (token) => {
    try {
      if (token && token.includes(".")) {
        // Simple JWT decode (for client-side, we'll just parse the payload)
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );
        const decoded = JSON.parse(jsonPayload);
        console.log("Decoded video token:", decoded);
        return decoded.url || token;
      }
      return token;
    } catch (error) {
      console.error("Error decoding video token:", error);
      return token;
    }
  };

  // Get video URL for direct linking (since window.open is not available in extensions)
  const getVideoPlayerUrl = (lesson) => {
    const videoUrl = decodeVideoToken(lesson.videoUrl);

    // Create a data URL with the video player HTML
    const videoPlayerHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>${lesson.title} - Video Player</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            background: #000; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
          }
          .container { 
            width: 100vw; 
            height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            position: relative;
          }
          video { 
            width: 100%; 
            height: 100%; 
            object-fit: contain; 
            outline: none;
          }
          .title { 
            position: absolute; 
            top: 20px; 
            left: 20px; 
            color: white; 
            background: rgba(0,0,0,0.8); 
            padding: 12px 20px; 
            border-radius: 8px; 
            font-size: 18px;
            font-weight: 600;
            z-index: 10;
            max-width: calc(100% - 40px);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            text-align: center;
            z-index: 5;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .error {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            max-width: 500px;
            z-index: 10;
          }
          .error h3 { color: #ff6b6b; margin-bottom: 15px; }
          .error p { margin-bottom: 20px; line-height: 1.5; color: #ccc; }
          .btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
          }
          .btn:hover { background: #0056b3; }
          .controls-info {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.7);
            color: #ccc;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 5;
          }
        </style>
      </head>
      <body>
        <div class="title">${lesson.title}</div>
        <div class="container">
          <div id="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading video...</p>
          </div>
          
          <div id="error" class="error" style="display: none;">
            <h3>⚠️ Video Error</h3>
            <p id="error-message">Failed to load video.</p>
            <button class="btn" onclick="retryVideo()">🔄 Retry</button>
            <button class="btn" onclick="copyVideoUrl()">📋 Copy Video URL</button>
          </div>
          
          <video id="video" controls style="display: none;" preload="metadata">
            Your browser does not support video playback.
          </video>
        </div>
        <div class="controls-info">Press F for fullscreen • Space to play/pause • Esc to exit</div>

        <script>
          const video = document.getElementById('video');
          const loading = document.getElementById('loading');
          const error = document.getElementById('error');
          const errorMessage = document.getElementById('error-message');
          const videoSrc = '${videoUrl}';
          let hls = null;
          
          function hideLoading() {
            loading.style.display = 'none';
          }
          
          function showVideo() {
            video.style.display = 'block';
            error.style.display = 'none';
          }
          
          function showError(msg) {
            hideLoading();
            video.style.display = 'none';
            error.style.display = 'block';
            errorMessage.textContent = msg;
          }
          
          function copyVideoUrl() {
            navigator.clipboard.writeText(videoSrc).then(() => {
              alert('Video URL copied to clipboard!');
            }).catch(() => {
              prompt('Copy this video URL:', videoSrc);
            });
          }
          
          function retryVideo() {
            error.style.display = 'none';
            loading.style.display = 'block';
            if (hls) {
              hls.destroy();
              hls = null;
            }
            video.src = '';
            setTimeout(initializeVideo, 1000);
          }
          
          function initializeVideo() {
            console.log('Initializing video with URL:', videoSrc);
            
            // Setup video event listeners
            video.addEventListener('canplay', () => {
              console.log('Video can play');
              hideLoading();
              showVideo();
            });
            
            video.addEventListener('error', (e) => {
              console.error('Video error:', e);
              showError('Failed to load video. Check console for details.');
            });
            
            video.addEventListener('loadedmetadata', () => {
              console.log('Video metadata loaded');
              hideLoading();
              showVideo();
            });
            
            // Initialize HLS or native playback
            if (Hls.isSupported()) {
              console.log('Using HLS.js');
              hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90
              });
              
              hls.loadSource(videoSrc);
              hls.attachMedia(video);
              
              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('HLS manifest parsed');
                hideLoading();
                showVideo();
              });
              
              hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS error:', data);
                if (data.fatal) {
                  let errorMsg = 'HLS streaming error occurred.';
                  switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                      errorMsg = 'Network error loading video. Check your connection.';
                      break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                      errorMsg = 'Media error occurred. Video format may be unsupported.';
                      break;
                  }
                  showError(errorMsg);
                }
              });
              
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              console.log('Using native HLS support');
              video.src = videoSrc;
            } else {
              showError('Your browser does not support HLS video streaming.');
            }
          }
          
          // Keyboard shortcuts
          document.addEventListener('keydown', (e) => {
            switch (e.key) {
              case ' ':
                e.preventDefault();
                if (video.paused) video.play();
                else video.pause();
                break;
              case 'f':
              case 'F':
                if (video.requestFullscreen) video.requestFullscreen();
                break;
              case 'Escape':
                if (document.fullscreenElement) document.exitFullscreen();
                break;
            }
          });
          
          // Initialize
          initializeVideo();
          
          // Cleanup
          if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
              if (hls) hls.destroy();
            });
          }
        </script>
      </body>
      </html>
    `;

    // Create data URL
    return (
      "data:text/html;charset=utf-8," + encodeURIComponent(videoPlayerHTML)
    );
  };

  // Copy video URL to clipboard
  const copyVideoUrl = (lesson) => {
    try {
      const videoUrl = decodeVideoToken(lesson.videoUrl);
      navigator.clipboard
        .writeText(videoUrl)
        .then(() => {
          setVideoPlayerStatus("copied");
          setTimeout(() => setVideoPlayerStatus(null), 3000);
        })
        .catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement("textarea");
          textArea.value = videoUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          setVideoPlayerStatus("copied");
          setTimeout(() => setVideoPlayerStatus(null), 3000);
        });
    } catch (error) {
      console.error("Error copying video URL:", error);
      setVideoPlayerStatus("copy-error");
      setTimeout(() => setVideoPlayerStatus(null), 3000);
    }
  };

  const handlePause = async (e, lesson, course) => {
    const videoElement = e.target;
    const module =
      selectedCourse?.modules?.find((m) =>
        m.lessons?.find((l) => l.id === lesson.id)
      ) || selectedModule;

    const current = videoElement.currentTime;
    const duration = videoElement.duration;
    const progress = Math.floor((current / duration) * 100);

    const data = {
      userId: authenticatedCustomer.id,
      lessonId: lesson.id,
      courseId: course?.id || selectedCourse?.id,
      moduleId: module?.id || "",
      status: "in_progress",
      progress: progress,
      lastPosition: current.toFixed(2),
    };

    try {
      const res = await fetch(`${storeDomain}/api/frontend/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) {
        console.warn("Failed to send progress update:", result.message);
      }
    } catch (err) {
      console.error("API Error:", err);
    }
  };

  if (error) {
    return <TextBlock appearance="critical">{error}</TextBlock>;
  }

  // Individual Lesson Detail View with Video Player
  if (selectedLesson) {
    return (
      <Page title={`${selectedLesson.title} - Lesson`}>
        <BlockStack spacing="loose">
          {/* Lesson Header */}
          <Card padding>
            <BlockStack spacing="base">
              <Button
                onPress={() => setSelectedLesson(null)}
                appearance="secondary"
              >
                ← Back to Lessons
              </Button>

              <Heading size="large">{selectedLesson.title}</Heading>

              {selectedLesson.description && (
                <TextBlock appearance="subdued">
                  {selectedLesson.description}
                </TextBlock>
              )}

              <InlineStack spacing="tight">
                {selectedLesson.videoUrl ? (
                  <Badge tone="success">🎥 Video Lesson</Badge>
                ) : (
                  <Badge tone="warning">📄 Text Lesson</Badge>
                )}
                {selectedLesson.duration && (
                  <Badge tone="info">⏱️ {selectedLesson.duration} min</Badge>
                )}
              </InlineStack>
            </BlockStack>
          </Card>

          {/* Video Player Section */}
          {selectedLesson.videoUrl && (
            <Card padding>
              <BlockStack spacing="base">
                <Heading size="medium">📹 Video Content</Heading>

                <View
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    backgroundColor: "#000",
                    borderRadius: "8px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {/* Video Player using external link since video element is not supported */}
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#000",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      padding: "40px",
                    }}
                  >
                    <TextBlock
                      style={{
                        color: "white",
                        fontSize: "48px",
                        marginBottom: "20px",
                      }}
                    >
                      🎬
                    </TextBlock>
                    <TextBlock
                      style={{
                        color: "white",
                        fontSize: "18px",
                        marginBottom: "10px",
                        textAlign: "center",
                      }}
                    >
                      {selectedLesson.title}
                    </TextBlock>
                    <TextBlock
                      style={{
                        color: "#ccc",
                        fontSize: "14px",
                        marginBottom: "20px",
                        textAlign: "center",
                      }}
                    >
                      Click the button below to watch this lesson in a new tab
                    </TextBlock>
                    <InlineStack spacing="tight">
                      <Button
                        to={getVideoPlayerUrl(selectedLesson)}
                        target="_blank"
                        appearance="primary"
                      >
                        🎥 Watch Video
                      </Button>
                      <Button
                        onPress={() => copyVideoUrl(selectedLesson)}
                        appearance="secondary"
                        size="small"
                      >
                        📋 Copy Link
                      </Button>
                    </InlineStack>
                  </View>
                </View>

                <TextBlock appearance="subdued" size="small">
                  💡 This video uses secure HLS streaming for the best viewing
                  experience.
                </TextBlock>

                {/* Copy Status Notification */}
                {videoPlayerStatus === "copied" && (
                  <Card padding>
                    <InlineStack spacing="tight">
                      <TextBlock>📋</TextBlock>
                      <TextBlock>Video URL copied to clipboard!</TextBlock>
                    </InlineStack>
                  </Card>
                )}
                {videoPlayerStatus === "copy-error" && (
                  <Card padding>
                    <InlineStack spacing="tight">
                      <TextBlock>❌</TextBlock>
                      <TextBlock>
                        Failed to copy URL. Please try again.
                      </TextBlock>
                    </InlineStack>
                  </Card>
                )}
              </BlockStack>
            </Card>
          )}

          {/* Lesson Content */}
          <Card padding>
            <BlockStack spacing="base">
              <Heading size="medium">📚 Lesson Content</Heading>

              {selectedLesson.content ? (
                <TextBlock>{selectedLesson.content}</TextBlock>
              ) : (
                <TextBlock appearance="subdued">
                  No additional content available for this lesson.
                </TextBlock>
              )}
            </BlockStack>
          </Card>

          {/* Lesson Resources */}
          {selectedLesson.files?.length > 0 && (
            <Card padding>
              <BlockStack spacing="base">
                <Heading size="medium">📎 Lesson Resources</Heading>

                <InlineStack spacing="tight">
                  {selectedLesson.files.map((file, index) => (
                    <Button
                      key={index}
                      to={file.url}
                      target="_blank"
                      appearance="primary"
                      kind="secondary"
                      size="small"
                    >
                      📄 Download Resource {index + 1}
                    </Button>
                  ))}
                </InlineStack>
              </BlockStack>
            </Card>
          )}

          {/* Lesson Progress */}
          <Card padding>
            <BlockStack spacing="base">
              <Heading size="medium">📊 Progress</Heading>

              <InlineStack spacing="tight">
                <Badge tone="info">
                  📍 Current Position: {Math.floor(lastPosition)}s
                </Badge>
                <Badge tone="success">✅ Lesson Accessed</Badge>
              </InlineStack>

              <TextBlock appearance="subdued" size="small">
                Your progress is automatically saved as you watch.
              </TextBlock>
            </BlockStack>
          </Card>
        </BlockStack>
      </Page>
    );
  }

  // Lesson Detail View
  if (selectedModule) {
    return (
      <Page title={`${selectedModule.title} - Lessons`}>
        <BlockStack spacing="loose">
          {/* Lesson View Header */}
          <Card padding>
            <BlockStack spacing="base">
              <Button
                onPress={() => setSelectedModule(null)}
                appearance="secondary"
              >
                ← Back to Modules
              </Button>

              <Heading size="large">{selectedModule.title}</Heading>

              {selectedModule.description && (
                <TextBlock appearance="subdued">
                  {selectedModule.description}
                </TextBlock>
              )}

              <InlineStack spacing="tight">
                <Badge tone="info">
                  📚 {selectedModule.lessons?.length || 0} Lessons
                </Badge>
                <Badge tone="success">
                  🎥{" "}
                  {selectedModule.lessons?.filter((lesson) => lesson.videoUrl)
                    .length || 0}{" "}
                  Videos
                </Badge>
                <Badge tone="warning">
                  📄{" "}
                  {selectedModule.lessons?.filter((lesson) => !lesson.videoUrl)
                    .length || 0}{" "}
                  Text Lessons
                </Badge>
              </InlineStack>
            </BlockStack>
          </Card>

          {/* Lessons Grid - Course Card Style */}
          {selectedModule.lessons?.length > 0 ? (
            <Grid columns={["33%", "33%", "33%"]} spacing="loose">
              {selectedModule.lessons.map((lesson, lessonIndex) => (
                <GridItem key={lesson.id}>
                  <Card padding>
                    <BlockStack spacing="tight">
                      <View>
                        <View maxInlineSize="100%">
                          <InlineStack
                            gap="100"
                            align="start"
                            style={{
                              position: "absolute",
                              top: "var(--p-space-100)",
                              left: "var(--p-space-100)",
                              zIndex: 1,
                            }}
                          >
                            <Badge tone="subdued">
                              Lesson {lessonIndex + 1}
                            </Badge>
                            {lesson.videoUrl ? (
                              <Badge tone="success">🎥 Video</Badge>
                            ) : (
                              <Badge tone="warning">📄 Text</Badge>
                            )}
                          </InlineStack>

                          <BlockStack
                            blockSize="230px"
                            inlineSize="100%"
                            overflow="hidden"
                            cornerRadius="base"
                          >
                            {lesson.thumbnail || lesson.videoUrl ? (
                              <View
                                style={{ position: "relative", height: "100%" }}
                              >
                                <Image
                                  source={
                                    lesson.thumbnail || `${lesson.videoUrl}#t=1`
                                  }
                                  description={lesson.title}
                                  blockSize="fill"
                                  inlineSize="100%"
                                  cornerRadius="base"
                                  style={{ objectFit: "cover" }}
                                />

                                {/* Play button overlay for videos */}
                                {lesson.videoUrl && (
                                  <View
                                    style={{
                                      position: "absolute",
                                      top: "50%",
                                      left: "50%",
                                      transform: "translate(-50%, -50%)",
                                      backgroundColor: "rgba(0,0,0,0.7)",
                                      borderRadius: "50%",
                                      padding: "16px",
                                      fontSize: "32px",
                                    }}
                                  >
                                    <TextBlock
                                      style={{
                                        color: "white",
                                        fontSize: "32px",
                                      }}
                                    >
                                      ▶️
                                    </TextBlock>
                                  </View>
                                )}

                                {/* Duration badge */}
                                {(lesson.duration || lesson.videoDuration) && (
                                  <View
                                    style={{
                                      position: "absolute",
                                      bottom: "8px",
                                      right: "8px",
                                      backgroundColor: "rgba(0,0,0,0.8)",
                                      color: "white",
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    <TextBlock
                                      style={{
                                        color: "white",
                                        fontSize: "12px",
                                      }}
                                    >
                                      {lesson.duration || lesson.videoDuration}{" "}
                                      min
                                    </TextBlock>
                                  </View>
                                )}
                              </View>
                            ) : (
                              <View
                                style={{
                                  backgroundColor: "#667eea",
                                  backgroundImage:
                                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "8px",
                                  color: "white",
                                }}
                              >
                                <BlockStack
                                  spacing="tight"
                                  style={{ textAlign: "center" }}
                                >
                                  <TextBlock
                                    style={{ fontSize: "48px", color: "white" }}
                                  >
                                    {lesson.videoUrl ? "🎥" : "📄"}
                                  </TextBlock>
                                  <TextBlock
                                    style={{
                                      fontSize: "14px",
                                      color: "white",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {lesson.videoUrl
                                      ? "Video Lesson"
                                      : "Text Lesson"}
                                  </TextBlock>
                                </BlockStack>
                              </View>
                            )}
                          </BlockStack>
                        </View>

                        <BlockStack spacing="tight" style={{ padding: 16 }}>
                          <InlineStack
                            spacing="tight"
                            inlineAlignment="space-between"
                          >
                            <Badge>
                              {lesson.videoUrl ? "Video Lesson" : "Text Lesson"}
                            </Badge>
                            {(lesson.duration || lesson.videoDuration) && (
                              <TextBlock size="small" appearance="subdued">
                                {lesson.duration || lesson.videoDuration} min
                              </TextBlock>
                            )}
                          </InlineStack>

                          <TextBlock
                            size="medium"
                            emphasis="bold"
                            style={{ color: "#1A237E" }}
                          >
                            {lesson.title}
                          </TextBlock>

                          <TextBlock size="small" appearance="subdued">
                            {lesson.description || "No description available"}
                          </TextBlock>

                          <TextBlock size="small" appearance="subdued">
                            Lesson {lessonIndex + 1} of{" "}
                            {selectedModule.lessons.length}
                          </TextBlock>

                          <InlineStack spacing="tight">
                            <TextBlock size="small">
                              {lesson.videoUrl
                                ? "🎥 Video Content"
                                : "📖 Text Content"}
                            </TextBlock>
                            {lesson.files?.length > 0 && (
                              <TextBlock size="small">
                                📎 {lesson.files.length} resources
                              </TextBlock>
                            )}
                          </InlineStack>

                          <Button
                            onPress={() => handleLessonSelect(lesson)}
                            appearance="primary"
                            kind="secondary"
                            loading={loadingLesson}
                          >
                            {loadingLesson
                              ? "Loading..."
                              : lesson.videoUrl
                              ? "▶️ Watch Lesson"
                              : "📖 Read Lesson"}
                          </Button>
                        </BlockStack>
                      </View>
                    </BlockStack>
                  </Card>
                </GridItem>
              ))}
            </Grid>
          ) : (
            <Card padding>
              <BlockStack spacing="tight">
                <Heading size="medium">📚 No lessons found</Heading>
                <TextBlock appearance="subdued">
                  This module doesn't have any lessons yet.
                </TextBlock>
              </BlockStack>
            </Card>
          )}
        </BlockStack>
      </Page>
    );
  }

  if (selectedCourse) {
    return (
      <Page title={selectedCourse.title}>
        <BlockStack spacing="loose">
          {/* Clean Header Section */}
          <Card padding>
            <BlockStack spacing="base">
              <Button
                onPress={() => setSelectedCourse(null)}
                appearance="secondary"
              >
                ← Back to Courses
              </Button>

              <Heading size="large">{selectedCourse.title}</Heading>

              {selectedCourse.description && (
                <TextBlock appearance="subdued">
                  {selectedCourse.description}
                </TextBlock>
              )}

              <InlineStack spacing="tight">
                <Badge tone="info">
                  📚 {selectedCourse.modules?.length || 0} Modules
                </Badge>
                <Badge tone="success">
                  🎯{" "}
                  {selectedCourse.modules?.reduce(
                    (total, module) => total + (module.lessons?.length || 0),
                    0
                  ) || 0}{" "}
                  Lessons
                </Badge>
              </InlineStack>
            </BlockStack>
          </Card>

          {/* Course Content */}
          {selectedCourse.modules?.length > 0 ? (
            <BlockStack spacing="base">
              <Heading size="medium">📖 Course Curriculum</Heading>

              {selectedCourse.modules.map((module, moduleIndex) => {
                // Check if module has videos
                const hasVideos = module.lessons?.some(
                  (lesson) => lesson.videoUrl
                );
                const videoCount =
                  module.lessons?.filter((lesson) => lesson.videoUrl).length ||
                  0;

                return (
                  <Card key={module.id || module.title} padding>
                    <BlockStack spacing="base">
                      {/* Professional Module Header */}
                      <Button
                        onPress={() => handleModuleSelect(module)}
                        kind="plain"
                        appearance="secondary"
                      >
                        <InlineStack
                          spacing="tight"
                          inlineAlignment="space-between"
                        >
                          <BlockStack spacing="none">
                            <InlineStack spacing="tight">
                              <Badge tone="attention">
                                Module {moduleIndex + 1}
                              </Badge>
                              <TextBlock size="medium" emphasis="bold">
                                📖 {module.title}
                              </TextBlock>
                              {/* Video availability indicator */}
                              {hasVideos && (
                                <Badge tone="success" size="small">
                                  🎥 {videoCount} video
                                  {videoCount !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </InlineStack>
                            {module.description && (
                              <TextBlock appearance="subdued" size="small">
                                {module.description}
                              </TextBlock>
                            )}
                          </BlockStack>

                          <InlineStack spacing="tight">
                            <Badge tone="info-strong">
                              {module.lessons?.length || 0} lessons
                            </Badge>
                          </InlineStack>
                        </InlineStack>
                      </Button>
                      {/* Inline lessons removed; navigation shows lessons on a dedicated view */}
                    </BlockStack>
                  </Card>
                );
              })}
            </BlockStack>
          ) : (
            <Card padding>
              <BlockStack spacing="tight">
                <Heading size="medium">📚 No modules found</Heading>
                <TextBlock appearance="subdued">
                  Course content will be available soon
                </TextBlock>
              </BlockStack>
            </Card>
          )}
        </BlockStack>
      </Page>
    );
  }

  return (
    <View>
      <TextBlock
        as="h2"
        size="large"
        emphasis="bold"
        style={{ marginBottom: "20px", color: "black" }}
      >
        My Courses
      </TextBlock>
      <Grid columns={["33%", "33%", "33%"]} spacing="loose">
        {courses.map((course, idx) => (
          <GridItem key={idx}>
            <Card padding>
              <BlockStack spacing="tight">
                <View>
                  <View maxInlineSize="100%">
                    <InlineStack
                      gap="100"
                      align="start"
                      style={{
                        position: "absolute",
                        top: "var(--p-space-100)",
                        left: "var(--p-space-100)",
                        zIndex: 1,
                      }}
                    >
                      <Badge tone="success">Bestseller</Badge>
                      <Badge tone="critical">25% OFF</Badge>
                    </InlineStack>
                    <BlockStack
                      blockSize="230px"
                      inlineSize="100%"
                      overflow="hidden"
                      cornerRadius="base"
                    >
                      <Image
                        source={course.thumbnail}
                        description={course.title}
                        blockSize="fill"
                        inlineSize="100%"
                        cornerRadius="base"
                        style={{ objectFit: "cover" }}
                      />
                    </BlockStack>
                  </View>

                  <BlockStack spacing="tight" style={{ padding: 16 }}>
                    <InlineStack
                      spacing="tight"
                      inlineAlignment="space-between"
                    >
                      <Badge>{course.category || "Web Development"}</Badge>
                      <TextBlock size="small" appearance="subdued">
                        {course.updatedAt ? `Updated ${course.updatedAt}` : ""}
                      </TextBlock>
                    </InlineStack>

                    <TextBlock
                      size="medium"
                      emphasis="bold"
                      style={{ color: "#1A237E" }}
                    >
                      {course.title}
                    </TextBlock>
                    <TextBlock size="small" appearance="subdued">
                      {course.description}
                    </TextBlock>
                    <TextBlock size="small" appearance="subdued">
                      by {course.instructor || "Instructor"}
                    </TextBlock>
                    <InlineStack spacing="tight">
                      <TextBlock size="small">
                        {course.rating || "4.9"}
                      </TextBlock>
                      <TextBlock size="small">
                        {course.students || "2,000"}
                      </TextBlock>
                      <TextBlock size="small">
                        {course.totalLessons || "100"} lessons
                      </TextBlock>
                      <TextBlock size="small">
                        {course.totalDuration || "40"} hours
                      </TextBlock>
                    </InlineStack>

                    <InlineStack spacing="tight">
                      <TextBlock size="medium" emphasis="bold">
                        ${course.price}
                      </TextBlock>
                      {course.oldPrice && (
                        <TextBlock
                          size="small"
                          appearance="subdued"
                          style={{ textDecorationLine: "line-through" }}
                        >
                          ${course.oldPrice}
                        </TextBlock>
                      )}
                    </InlineStack>

                    {progressMap[course.id] !== undefined && (
                      <BlockStack spacing="none">
                        <TextBlock size="small" appearance="subdued">
                          Progress: {progressMap[course.id]}%
                        </TextBlock>
                        <View
                          border="base"
                          cornerRadius="base"
                          inlineSize="100%"
                          blockSize="8px"
                          background="bg-subdued"
                          style={{ overflow: "hidden" }}
                        >
                          <View
                            background="bg-success"
                            inlineSize={`${progressMap[course.id]}%`}
                            blockSize="100%"
                          />
                        </View>
                      </BlockStack>
                    )}

                    <Button
                      onPress={() => handleCourseSelect(course)}
                      appearance="primary"
                      kind="secondary"
                      loading={loadingModules}
                    >
                      {loadingModules ? "Loading Modules..." : "View Modules"}
                    </Button>
                  </BlockStack>
                </View>
              </BlockStack>
            </Card>
          </GridItem>
        ))}
      </Grid>
    </View>
  );
}
//   return (
//     <Page title="Wishlists">
//       <Grid columns={250} rows="auto" spacing="base" blockAlignment="center">
//         {wishlists.map((item) => {
//           return (
//             <GridItem key={item.id} columnSpan={1}>
//               <ResourceItem to={`/wishlist/${item.id}`}>
//                 <BlockStack>
//                   <Image source={item.items[0]?.productImage} />
//                   <Text>{item.items[0]?.label}</Text>
//                 </BlockStack>
//               </ResourceItem>
//             </GridItem>
//           );
//         })}
//       </Grid>
//     </Page>
//   );
// }

// function NotFound() {
//   return (
//     <BlockStack>
//       <Heading>Resource Not found</Heading>
//     </BlockStack>
//   );

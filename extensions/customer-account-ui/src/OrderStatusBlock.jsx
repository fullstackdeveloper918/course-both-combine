import {
  BlockStack,
  InlineStack,
  View,
  TextBlock,
  Image,
  reactExtension,
  useApi,
  Badge,
  Button,
  Grid,
  Card,
} from "@shopify/ui-extensions-react/customer-account";
import { GridItem } from "@shopify/ui-extensions/checkout";
import { useEffect, useState } from "react";

export default reactExtension(
  "customer-account.order-index.block.render",
  () => <CourseCards />
);

function CourseCards() {
  const { i18n } = useApi();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [error, setError] = useState("");
  const [progressMap, setProgressMap] = useState({});
  const [lastPosition, setLastPosition] = useState(0);

  console.log(progressMap, "progressMap to see");
  const token =
    "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0ZXN0aW5nYXBwc3N0b3JlLWQubXlzaG9waWZ5LmNvbSIsImF1ZCI6InRlc3RpbmdhcHBzc3RvcmUtZC5teXNob3BpZnkuY29tIiwibmJmIjoxNzUzNDM4NTk4LCJjaGVja291dF9wcm9maWxlX2lkIjoyMzE5MTIyNTExLCJjaGVja291dF9wcm9maWxlX3B1Ymxpc2hlZCI6dHJ1ZSwidXNlcl9pZCI6ODE2NzE3ODI0NzksImV4cCI6MTc1MzQ0MjE5OH0.DChkjhim3ijHGV7R4RFFlDQg3MkToy4U9F1bcu7t0YA";

  function decodeJwt(token) {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  }

  const payload = decodeJwt(token);
  const storeDomain = "https://mentioned-micro-cohen-offers.trycloudflare.com";

  useEffect(() => {
    fetch(`${storeDomain}/api/frontend/courses`)
      // fetch(`/apps/courses/frontend/courses`)
      .then((res) => res.json())
      .then(async (data) => {
        if (data.success && Array.isArray(data.data)) {
          setCourses(data.data);
          const progressData = {};
          for (let course of data.data) {
            console.log(payload, course, "here to se daata");
            try {
              const res = await fetch(
                `${storeDomain}/api/frontend/progress/courseprogress/${payload.user_id}/${course.id}`
              );

              const result = await res.json();
              console.log(result?.data, "to see");
              if (result.success) {
                progressData[course.id] = result?.data.averageProgress;
              }
            } catch (err) {
              console.warn(`Failed to fetch progress for course ${course.id}`);
            }
          }
          setProgressMap(progressData);
        } else {
          setError("No courses found.");
        }
      })
      .catch(() => {
        setError("Failed to load courses.");
      });
  }, []);

  const handlePause = async (e, lesson, course) => {
    const videoElement = e.target;
    const module = selectedCourse.modules.find((m) =>
      m.lessons.find((l) => l.id === lesson.id)
    );
    const current = videoElement.currentTime;
    const duration = videoElement.duration;
    const progress = Math.floor((current / duration) * 100);

    const data = {
      userId: payload.user_id,
      lessonId: lesson.id,
      courseId: course.id,
      moduleId: module?.id || "",
      status: "not_started",
      progress: progress,
      lastPosition: current.toFixed(2),
    };

    try {
      const res = await fetch(`${storeDomain}/api/progress`, {
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

  if (selectedCourse) {
    return (
      <View>
        <BlockStack spacing="loose">
          <Button onPress={() => setSelectedCourse(null)}>
            ← Back to Courses
          </Button>
          <TextBlock size="large" emphasis="bold">
            {selectedCourse.title}
          </TextBlock>

          {selectedCourse.modules?.length > 0 ? (
            selectedCourse.modules.map((module) => (
              <Card padding key={module.id || module.title}>
                <BlockStack>
                  <TextBlock emphasis="bold" size="small">
                    Module Name:
                  </TextBlock>
                  <TextBlock emphasis="bold">{module.title}</TextBlock>
                  {module.lessons?.length > 0 ? (
                    module.lessons.map((lesson) => (
                      <Card key={lesson.id} padding>
                        <BlockStack spacing="tight">
                          <TextBlock emphasis="bold" size="small">
                            Lesson Name:
                          </TextBlock>
                          <TextBlock size="medium" emphasis="bold">
                            {lesson.title}
                          </TextBlock>

                          {lesson.description && (
                            <>
                              <TextBlock emphasis="bold" size="small">
                                Description:
                              </TextBlock>
                              <TextBlock appearance="subdued" size="small">
                                {lesson.description}
                              </TextBlock>
                            </>
                          )}

                          {lesson.content && (
                            <>
                              <TextBlock emphasis="bold" size="small">
                                Content:
                              </TextBlock>
                              <TextBlock size="small" appearance="subdued">
                                {lesson.content}
                              </TextBlock>
                            </>
                          )}

                          <InlineStack spacing="tight">
                            {lesson.order && (
                              <TextBlock size="small">
                                Order: {lesson.order}
                              </TextBlock>
                            )}
                            {(lesson.duration || lesson.videoDuration) && (
                              <TextBlock size="small">
                                Duration:{" "}
                                {lesson.duration || lesson.videoDuration} mins
                              </TextBlock>
                            )}
                          </InlineStack>

                          {/* ✅ Embedded Video */}
                          {lesson.videoUrl && (
                            <video
                              controls
                              width="100%"
                              onPause={(e) =>
                                handlePause(e, lesson, selectedCourse)
                              }
                              onTimeUpdate={(e) =>
                                setLastPosition(e.target.currentTime)
                              }
                            >
                              <source src={lesson.videoUrl} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          )}

                          {/* 📂 File Downloads */}
                          {lesson.files?.length > 0 &&
                            lesson.files.map((file, index) => (
                              <Button
                                key={index}
                                to={file.url}
                                target="_blank"
                                appearance="critical"
                                kind="plain"
                              >
                                Download PDF File Here
                              </Button>
                            ))}
                        </BlockStack>
                      </Card>
                    ))
                  ) : (
                    <TextBlock appearance="subdued" size="small">
                      No lessons found.
                    </TextBlock>
                  )}
                </BlockStack>
              </Card>
            ))
          ) : (
            <TextBlock>No modules found.</TextBlock>
          )}
        </BlockStack>
      </View>
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
                      to={`${storeDomain}/module-detail?id=${course.slug || course.id}`}
                      appearance="primary"
                      kind="secondary"
                    >
                      View Details
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

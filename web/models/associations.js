import Course from "./Course.js";
import Module from "./Module.js";
import Lesson from "./Lesson.js";
import File from "./File.js";
import User from "./User.js";
import Progress from "./Progress.js";
import CourseAccess from "./CourseAccess.js";
import Merchant from "./Merchant.js";

// 📘 Course Associations
Course.hasMany(Module, { foreignKey: "courseId", as: "modules" });
Course.hasMany(Lesson, { foreignKey: "courseId", as: "lessons" });
Course.hasMany(File, { foreignKey: "courseId", as: "files" });
Course.hasMany(CourseAccess, { foreignKey: "courseId", as: "courseAccess" });
Course.belongsTo(Merchant, { foreignKey: "merchantId", as: "merchant" });

// 📘 Module Associations
Module.belongsTo(Course, { foreignKey: "courseId", as: "course" });
Module.hasMany(Lesson, { foreignKey: "moduleId", as: "lessons" });

// 📘 Lesson Associations
Lesson.belongsTo(Course, { foreignKey: "courseId", as: "course" });
Lesson.belongsTo(Module, { foreignKey: "moduleId", as: "module" });
Lesson.belongsTo(Merchant, { foreignKey: "merchantId", as: "merchant" });

Lesson.hasMany(File, { foreignKey: "lessonId", as: "files" });
Lesson.hasMany(Progress, { foreignKey: "lessonId", as: "progress" });

// 📘 File Associations
File.belongsTo(Course, { foreignKey: "courseId", as: "course" });
File.belongsTo(Lesson, { foreignKey: "lessonId", as: "lesson" });

// 📘 User Associations
User.hasMany(CourseAccess, { foreignKey: "userId", as: "courseAccess" });
User.hasMany(Progress, { foreignKey: "userId", as: "progress" });
User.belongsTo(Merchant, { foreignKey: "merchantId", as: "merchant" });

// 📘 Progress Associations
Progress.belongsTo(User, { foreignKey: "userId", as: "user" });
Progress.belongsTo(Course, { foreignKey: "courseId", as: "course" });
Progress.belongsTo(Module, { foreignKey: "moduleId", as: "module" });
Progress.belongsTo(Lesson, { foreignKey: "lessonId", as: "lesson" });

// 📘 CourseAccess Associations
CourseAccess.belongsTo(User, { foreignKey: "userId", as: "user" });
CourseAccess.belongsTo(Course, { foreignKey: "courseId", as: "course" });

// 📘 Merchant Associations
Merchant.hasMany(Course, { foreignKey: "merchantId", as: "courses" });
Merchant.hasMany(User, { foreignKey: "merchantId", as: "users" });
Merchant.hasMany(Lesson, { foreignKey: "merchantId", as: "lessons" });

export { Course, Module, Lesson, File, User, Progress, CourseAccess, Merchant };

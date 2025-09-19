import { Op } from "sequelize";

import Course from "../models/Course.js";
import Merchant from "../models/Merchant.js";
import CourseAccess from "../models/CourseAccess.js";
import Module from "../models/Module.js";
import { ApiError } from "../utils/ApiUtilis.js";
import Lesson from "../models/Lesson.js";

function parseShopifyCustomerId(customerid) {
  if (
    typeof customerid === "string" &&
    customerid.startsWith("gid://shopify/Customer/")
  ) {
    return customerid.replace("gid://shopify/Customer/", "");
  }
  return customerid;
}

export const GetAllUserCourses = async (req, res, next) => {
  try {
    console.log("GetAllUserCourses running...");
    const { customerid, shop } = req.params;
    if (!customerid || !shop) {
      throw new ApiError("Customer ID and Shop are required.", 400);
    }

    const numericCustomerId = parseShopifyCustomerId(customerid);
    console.log("numericCustomerId", numericCustomerId);

    const merchant = await Merchant.findOne({ where: { shop } });
    if (!merchant) {
      throw new ApiError("Merchant not found for this shop.", 404);
    }
    console.log("merchant....", merchant.id);

    // Find courses for this user
    const userCourses = await CourseAccess.findAll({
      where: {
        shopifyCustomerId: numericCustomerId,
        merchantId: merchant.id,
      },
    });

    if (!userCourses.length) {
      throw new ApiError("You Have Not Purchased Any Courses.", 404);
    }

    console.log("courses Available", userCourses);

    const courseIds = userCourses.map((course) => course.courseId);

    const courses = await Course.findAll({
      where: {
        merchantId: merchant.id,
        id: { [Op.in]: courseIds },
      },
      include: [
        {
          model: Module,
          as: "modules",
          include: [
            {
              model: Lesson,
              as: "lessons",
              where: { status: "published" },
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log("courses", courses);

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error(error);
    return next(
      new ApiError(
        error?.message || "Internal server error",
        error?.status || 500
      )
    );
  }
};

// import Course from "../models/Course.js";
// import Merchant from "../models/Merchant.js";
// import CourseAccess from "../models/CourseAccess.js";
// import Module from "../models/Module.js";
// import { ApiError } from "../utils/ApiUtilis.js";

// export const GetAllUserCourses = async (req, res, next) => {
//   try {
//     let { customerid, shop } = req.params;
//     if (!customerid || !shop) {
//       throw new ApiError("Customer ID and Shop are required.", 400);
//     }

//     const numericcutomerid =
//       typeof customerid === "string" &&
//       customerid.startsWith("gid://shopify/Customer/")
//         ? customerid.replace("gid://shopify/Customer/", "")
//         : customerid;

//     console.log("numericcutomerid", numericcutomerid);

//     const merchant = await Merchant.findOne({
//       where: { shop: shop },
//     });

//     if (!merchant) {
//       throw new ApiError("Merchant not found for this shop.", 404);
//     }

//     // find the Courses of user
//     let userCourses = await CourseAccess.findAll({
//       where: { shopifyCustomerId: numericcutomerid, merchantId: merchant.id },
//     });

//     if (!userCourses.length) {
//       throw new ApiError("You Have Not Purchased Any Courses.", 404);
//     }
//     console.log("courses Available", userCourses);
//     const merchantId = merchant.id;

//     const where = {};

//     where.merchantId = merchantId;
//     where.id = [...userCourses.map((course) => course.courseId)];

//     const courses = await Course.findAll({
//       where,
//       include: [
//         {
//           model: Module,
//           as: "modules",
//           include: [
//             {
//               where: { status: "published" },
//               model: Lesson,
//               as: "lessons",
//             },
//           ],
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//     });
//     console.log("courses", courses);

//     res.status(200).json({
//       success: true,
//       count: courses.length,
//       data: courses,
//     });
//   } catch (error) {
//     console.log(error);

//     return next(new ApiError(error?.message, error?.status));
//     // res.status(500).json({
//     //   success: false,
//     //   error: error.message,
//     // });
//   }
// };

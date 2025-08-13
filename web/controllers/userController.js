import {
  User,
  CourseAccess,
  Progress,
  Merchant,
  Course,
  Module,
  Lesson,
} from "../models/associations.js";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Create a new user
// export const createUser = async (req, res) => {
//   try {
//     const {
//       // shopifyCustomerId,
//       email,
//       firstName,
//       lastName,
//       role,
//       merchantId,
//     } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({
//       where: {
//         [Op.or]: [{ email }, { merchantId }],
//       },
//     });

//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         error: "User already exists",
//       });
//     }

//     const user = await User.create({
//       shopifyCustomerId,
//       email,
//       firstName,
//       lastName,
//       role,
//       merchantId,
//     });

//     res.status(201).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

export const createUser = async (req, res) => {
  try {
    const session = res.locals.shopify?.session || req.session;
    let shopDomain;

    if (process.env.NODE_ENV === "development") {
      shopDomain = process.env.TEST_DOMAIN;
    } else if (session && session.shop) {
      shopDomain = session.shop;
    } else {
      return res
        .status(401)
        .json({ error: "Unauthorized: No valid Shopify session." });
    }

    const merchant = await Merchant.findOne({ where: { shop: shopDomain } });

    if (!merchant) {
      return res
        .status(404)
        .json({ error: "Merchant not found for this shop." });
    }

    const accessToken = merchant.shopifyAccessToken;
    const { email, firstName, lastName, role } = req.body;

    // Check if user already exists for this merchant
    const existingUser = await User.findOne({
      where: {
        email,
        merchantId: merchant.id,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already exists for this merchant",
      });
    }

    // Step 1: Create Customer in Shopify
    const shopifyPayload = {
      customer: {
        first_name: firstName,
        last_name: lastName,
        email,
        tags: Array.isArray(role) ? role.join(",") : role || "", // tags must be comma-separated string
      },
    };

    const shopifyRes = await fetch(
      `https://${shopDomain}/admin/api/2023-10/customers.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shopifyPayload),
      }
    );

    const shopifyData = await shopifyRes.json();
    console.log("Shopify Response:", shopifyData);

    if (!shopifyRes.ok || !shopifyData.customer) {
      return res.status(500).json({
        success: false,
        error: "Failed to create customer in Shopify",
        details: shopifyData,
      });
    }

    const shopifyCustomerId = shopifyData.customer.id;

    // Step 2: Store user in local DB
    const user = await User.create({
      shopifyCustomerId,
      email,
      firstName,
      lastName,
      role: Array.isArray(role) ? role[0] : role,
      merchantId: merchant.id,
    });

    res.status(201).json({
      success: true,
      data: user,
      shopifyCustomer: shopifyData.customer,
    });
  } catch (error) {
    console.error("User creation error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const { merchantId, role, search } = req.query;
    const where = {};
    where.deleteFlag = false;
    if (merchantId) where.merchantId = merchantId;
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      include: [
        {
          model: CourseAccess,
          as: "courseAccess",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single user
export const getUser = async (req, res) => {
  try {
    const session = res.locals.shopify?.session || req.session;
    let shopDomain;

    if (process.env.NODE_ENV === "development") {
      shopDomain = process.env.TEST_DOMAIN;
    } else if (session && session.shop) {
      shopDomain = session.shop;
    } else {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: No valid Shopify session.",
      });
    }

    const merchant = await Merchant.findOne({ where: { shop: shopDomain } });
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: "Merchant not found for this shop.",
      });
    }

    const user = await User.findOne({
      where: {
        id: req.params.id,
        deleteFlag: false,
      },
      include: [
        {
          model: CourseAccess,
          as: "courseAccess",
        },
        {
          model: Progress,
          as: "progress",
        },
      ],
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if user belongs to the current merchant
    if (user.merchantId !== merchant.id) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access to this user.",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      role,
      isActive,
      subscriptionStatus,
      subscriptionEndDate,
    } = req.body;

    const user = await User.findOne({
      where: {
        id: req.params.id,
        deleteFlag: false,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Dynamically build update object
    const updateFields = {};
    if (email !== undefined) updateFields.email = email;
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (role !== undefined) {
      updateFields.role = Array.isArray(role) ? role[0] : role;
    }
    if (isActive !== undefined) updateFields.isActive = isActive;
    if (subscriptionStatus !== undefined)
      updateFields.subscriptionStatus = subscriptionStatus;
    if (subscriptionEndDate !== undefined)
      updateFields.subscriptionEndDate = subscriptionEndDate;

    await user.update(updateFields); // Local DB update

    // Get merchant data
    const merchant = await Merchant.findByPk(user.merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: "Merchant not found",
      });
    }

    const shopifyCustomerId = user.shopifyCustomerId;
    if (!shopifyCustomerId) {
      return res.status(400).json({
        success: false,
        error: "Missing Shopify Customer ID",
      });
    }

    // Build Shopify update payload
    const shopifyPayload = {
      customer: {
        id: shopifyCustomerId,
        email: email || user.email,
        first_name: firstName || user.firstName,
        last_name: lastName || user.lastName,
        tags: role
          ? Array.isArray(role)
            ? role.join(",")
            : role
          : user.role || "", // comma-separated tags
      },
    };

    const shopifyRes = await fetch(
      `https://${merchant.shop}/admin/api/2023-10/customers/${shopifyCustomerId}.json`,
      {
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": merchant.shopifyAccessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shopifyPayload),
      }
    );

    const shopifyData = await shopifyRes.json();

    if (!shopifyRes.ok || !shopifyData.customer) {
      console.error("Shopify update failed:", shopifyData);
      return res.status(500).json({
        success: false,
        error: "Failed to update customer on Shopify",
        details: shopifyData,
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
      shopifyCustomer: shopifyData.customer,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const session = res.locals.shopify?.session || req.session;
    let shopDomain;

    if (process.env.NODE_ENV === "development") {
      shopDomain = process.env.TEST_DOMAIN;
    } else if (session && session.shop) {
      shopDomain = session.shop;
    } else {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: No valid Shopify session.",
      });
    }

    const merchant = await Merchant.findOne({ where: { shop: shopDomain } });
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: "Merchant not found for this shop.",
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // ✅ Ensure the user belongs to the merchant
    if (user.merchantId !== merchant.id) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access to this user.",
      });
    }

    // ✅ Delete Shopify customer if exists
    if (user.shopifyCustomerId) {
      const shopifyRes = await fetch(
        `https://${shopDomain}/admin/api/2023-10/customers/${user.shopifyCustomerId}.json`,
        {
          method: "DELETE",
          headers: {
            "X-Shopify-Access-Token": merchant.shopifyAccessToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (!shopifyRes.ok) {
        const shopifyData = await shopifyRes.json();
        return res.status(500).json({
          success: false,
          error: "Failed to delete Shopify customer",
          details: shopifyData,
        });
      }
    }

    // ✅ Soft delete the user
    await user.update({
      deleteFlag: true,
      deletedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "User soft-deleted and Shopify customer removed.",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get user's courses
export const getUserCourses = async (req, res) => {
  try {
    console.log("running");

    const userId = req.params.id;

    const courseAccess = await CourseAccess.findAll({
      where: { userId },
      include: [
        {
          model: Course,
          as: "course",
          include: [
            {
              model: Module,
              as: "modules",
              include: [
                {
                  model: Lesson,
                  as: "lessons",
                },
              ],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      count: courseAccess.length,
      data: courseAccess,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get user's progress
export const getUserProgress = async (req, res) => {
  try {
    const userId = req.params.id;
    const { courseId } = req.query;
    const where = { userId };

    if (courseId) where.courseId = courseId;

    const progress = await Progress.findAll({
      where,
      include: [
        {
          model: Course,
          as: "course",
        },
        {
          model: Module,
          as: "module",
        },
        {
          model: Lesson,
          as: "lesson",
        },
      ],
      order: [["lastAccessedAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: progress.length,
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update user's progress
export const updateUserProgress = async (req, res) => {
  try {
    const { lessonId, courseId, moduleId, status, progress, lastPosition } =
      req.body;
    const userId = req.params.id;

    const [userProgress, created] = await Progress.findOrCreate({
      where: { userId, lessonId },
      defaults: {
        courseId,
        moduleId,
        status,
        progress,
        lastPosition,
        lastAccessedAt: new Date(),
      },
    });

    if (!created) {
      await userProgress.update({
        status,
        progress,
        lastPosition,
        lastAccessedAt: new Date(),
        completedAt: status === "completed" ? new Date() : null,
      });
    }

    res.status(200).json({
      success: true,
      data: userProgress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;

    const [
      totalCourses,
      completedCourses,
      totalLessons,
      completedLessons,
      totalProgress,
    ] = await Promise.all([
      CourseAccess.count({ where: { userId } }),
      CourseAccess.count({ where: { userId, status: "completed" } }),
      Progress.count({ where: { userId } }),
      Progress.count({ where: { userId, status: "completed" } }),
      Progress.findAll({
        where: { userId },
        attributes: [
          [sequelize.fn("AVG", sequelize.col("progress")), "averageProgress"],
        ],
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        completedCourses,
        totalLessons,
        completedLessons,
        averageProgress: totalProgress[0].getDataValue("averageProgress") || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

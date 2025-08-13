import fs from "fs";
import path from "path";

// Globaly Error Handler Middelware
// export const errorHandler = (err, req, res, next) => {
//   let status = err?.status || 500;
//   let message = err?.message || "Something went wrong";

//   return res.status(status).json({
//     status,
//     success: false,
//     message,
//   });
// };

// Custom Api Error
export class ApiError extends Error {
  constructor(message = "Something went wrong", status = 500) {
    super(message);
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Success Return Response

export const SuccessResponse = (
  res,
  data = null,
  message = "Success",
  status = 200
) => {
  // Return Statement

  return res.status(status).json({
    status,
    success: true,
    message,
    data,
  });
};

export const errorHandler = (err, req, res, next) => {
  const status = err?.status || 500;
  const message = err?.message || "Something went wrong";

  // Ensure the logs directory exists
  const logDir = path.join(process.cwd(), "logs"); // more reliable than __dirname for middleware
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true }); // recursive in case parent dirs are missing
  }

  const logFile = path.join(logDir, "error.log");

  const errorLog = `[${new Date().toISOString()}]
URL: ${req.originalUrl}
Method: ${req.method}
Status: ${status}
Message: ${message}
Stack: ${err?.stack || "No stack trace"}
---------------------------------------------
`;

  fs.appendFile(logFile, errorLog, (fsErr) => {
    if (fsErr) {
      console.error("Failed to write error log:", fsErr);
    }
  });

  return res.status(status).json({
    status,
    success: false,
    message,
  });
};

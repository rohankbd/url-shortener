class ErrorHandler {
  // Centralized error handling middleware
  static handleError(err, req, res, next) {
    console.error("Error:", err);

    // Default error response
    const errorResponse = {
      success: false,
      message: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
      }),
    };

    // Determine status code based on error type
    const statusCode = err.statusCode || 500;

    // Log specific error types
    switch (true) {
      case err.name === "ValidationError":
        errorResponse.message = "Validation Failed";
        errorResponse.errors = err.details;
        return res.status(400).json(errorResponse);

      case err.name === "UnauthorizedError":
        return res.status(401).json({
          success: false,
          message: "Unauthorized Access",
        });

      case err.name === "ForbiddenError":
        return res.status(403).json({
          success: false,
          message: "Forbidden Access",
        });

      default:
        return res.status(statusCode).json(errorResponse);
    }
  }

  // Method to create custom error
  static createError(message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }
}

export default ErrorHandler;

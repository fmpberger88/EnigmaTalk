// errorHandler.js

function errorHandler(err, req, res, next) {
    console.error(err.stack); // Log error to console; consider using a more advanced logging solution for production

    const errorResponse = {
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        success: false,
        error: errorResponse,
        // Provide stack trace only in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

module.exports = errorHandler;

import { ErrorHandler } from "hono";
import { AppError, ServerError } from "../utils/errors";

export const errorHandler: ErrorHandler = (err, c) => {
    console.error("Error:", err);

    if (err instanceof AppError) {
        return c.json(
            {
                status: "error",
                error: err.message,
                code: err.code,
            },
            // @ts-ignore: Hono status code type matching
            err.statusCode
        );
    }

    // Fallback for unexpected errors
    const serverError = new ServerError(err.message || "An unexpected error occurred");
    return c.json(
        {
            status: "error",
            error: serverError.message,
            code: serverError.code,
        },
        500
    );
};

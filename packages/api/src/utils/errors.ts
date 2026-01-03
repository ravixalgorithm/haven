export class AppError extends Error {
    public statusCode: number;
    public code: string;

    constructor(message: string, statusCode: number = 500, code: string = "SERVER_ERROR") {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400, "VALIDATION_ERROR");
    }
}

export class AuthError extends AppError {
    constructor(message: string = "Unauthorized") {
        super(message, 401, "AUTH_ERROR");
    }
}

export class PermissionError extends AppError {
    constructor(message: string = "Forbidden") {
        super(message, 403, "PERMISSION_ERROR");
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Not Found") {
        super(message, 404, "NOT_FOUND");
    }
}

export class ServerError extends AppError {
    constructor(message: string = "Internal Server Error") {
        super(message, 500, "SERVER_ERROR");
    }
}

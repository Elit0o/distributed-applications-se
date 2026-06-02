using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using MovieTheatre.WebServices.Exceptions;

namespace MovieTheatre.WebServices.Handlers;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "An error occurred in the MovieTheatre API: {Message}", exception.Message);
        var (statusCode, title) = exception switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, "The requested resource was not found."),
            BadRequestException => (StatusCodes.Status400BadRequest, "Invalid operation or invalid data."),
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "You do not have access."),
            KeyNotFoundException => (StatusCodes.Status404NotFound, "The resource is missing from the database."),
            _ => (StatusCodes.Status500InternalServerError, "An internal server error occurred.")
        };

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = exception.Message,
            Instance = httpContext.Request.Path
        };

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/problem+json";

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        return true;
    }
}
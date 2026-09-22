using JCS.Application.Interfaces.Repositories;
using JCS.Domain.Entities;
using Microsoft.AspNetCore.Mvc.Filters;

namespace JCS.API.Filters;

public class AuditActionFilter : IAsyncActionFilter
{
    private readonly IAuditLogRepository _auditLogRepository;

    public AuditActionFilter(IAuditLogRepository auditLogRepository)
    {
        _auditLogRepository = auditLogRepository;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();
        var request = context.HttpContext.Request;

        if (request.Method is not ("POST" or "PUT" or "DELETE") || executed.Exception != null)
        {
            return;
        }

        var user = context.HttpContext.User.Identity?.Name ?? "Anonymous";
        var action = $"{request.Method} {request.Path}";

        await _auditLogRepository.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = action,
            PerformedBy = user,
            EntityName = context.Controller.GetType().Name.Replace("Controller", string.Empty),
            EntityId = context.RouteData.Values.TryGetValue("id", out var id) ? id?.ToString() : null,
            Details = $"HTTP {context.HttpContext.Response.StatusCode}",
            PerformedAt = DateTime.UtcNow
        },
        context.HttpContext.RequestAborted);
    }
}

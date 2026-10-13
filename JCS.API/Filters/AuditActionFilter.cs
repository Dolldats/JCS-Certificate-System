using JCS.Application.Interfaces.Repositories;
using JCS.Application.DTOs.Participant;
using JCS.Domain.Entities;
using JCS.Domain.Enum;
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

        // Audit records are already the result of an audit action; don't create
        // a second, low-value record every time the audit endpoint is written.
        if (request.Path.StartsWithSegments("/api/AuditLogs", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var user = context.HttpContext.User.Identity?.Name ?? "Anonymous";
        var action = $"{request.Method} {request.Path}";
        var entityName = context.Controller.GetType().Name.Replace("Controller", string.Empty);
        string? entityId = context.RouteData.Values.TryGetValue("id", out var id) ? id?.ToString() : null;
        var details = $"HTTP {context.HttpContext.Response.StatusCode}";
        Auxiliary? auxiliary = null;

        // Give participant enrollment logs the context an admin needs to understand
        // the action without opening browser network tools.
        if (request.Method == "POST"
            && context.ActionArguments.TryGetValue("dto", out var argument)
            && argument is CreateParticipantDto participant)
        {
            action = "Participant Added";
            entityName = "Participant";
            entityId = participant.MembershipId;
            auxiliary = participant.Auxiliary;
            details = $"{participant.FullName} ({participant.MembershipId}) added to event {participant.EventId}; " +
                $"verification: {participant.VerificationStatus}; HTTP {context.HttpContext.Response.StatusCode}.";
        }

        await _auditLogRepository.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = action,
            PerformedBy = user,
            Auxiliary = auxiliary,
            EntityName = entityName,
            EntityId = entityId,
            Details = details,
            PerformedAt = DateTime.UtcNow
        },
        context.HttpContext.RequestAborted);
    }
}

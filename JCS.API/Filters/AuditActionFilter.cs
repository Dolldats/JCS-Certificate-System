using JCS.Application.Common;
using JCS.Application.Interfaces.Repositories;
using JCS.Domain.Entities;
using JCS.Domain.Enum;
using Microsoft.AspNetCore.Mvc.Filters;

namespace JCS.API.Filters;

public class AuditActionFilter : IAsyncActionFilter
{
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IAdminAssignmentRepository _adminAssignmentRepository;

    public AuditActionFilter(
        IAuditLogRepository auditLogRepository,
        IAdminAssignmentRepository adminAssignmentRepository)
    {
        _auditLogRepository = auditLogRepository;
        _adminAssignmentRepository = adminAssignmentRepository;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();
        var request = context.HttpContext.Request;

        if (request.Method is not ("POST" or "PUT" or "DELETE") || executed.Exception != null)
        {
            return;
        }

        var user = context.HttpContext.User;
        var membershipId = user.GetMembershipId();
        var performedBy = membershipId ?? "Anonymous";

        Auxiliary? auxiliary = ParseAuxiliary(user.FindFirst("Auxiliary")?.Value);
        if (auxiliary == null && membershipId != null)
        {
            try
            {
                var assignment = await _adminAssignmentRepository.GetActiveAssignmentAsync(
                    membershipId, context.HttpContext.RequestAborted);
                auxiliary = assignment?.Auxiliary;
            }
            catch (Exception)
            {
            }
        }

        var action = $"{request.Method} {request.Path}";

        await _auditLogRepository.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = action,
            PerformedBy = performedBy,
            Auxiliary = auxiliary,
            EntityName = context.Controller.GetType().Name.Replace("Controller", string.Empty),
            EntityId = context.RouteData.Values.TryGetValue("id", out var id) ? id?.ToString() : null,
            Details = $"HTTP {context.HttpContext.Response.StatusCode}",
            PerformedAt = DateTime.UtcNow
        },
        context.HttpContext.RequestAborted);
    }

    private static Auxiliary? ParseAuxiliary(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)
            || string.Equals(value, "None", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return Enum.TryParse<Auxiliary>(value, true, out var parsed) ? parsed : null;
    }
}

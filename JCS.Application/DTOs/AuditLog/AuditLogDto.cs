namespace JCS.Application.DTOs.AuditLog;

public record AuditLogDto(Guid Id, string Action, string PerformedBy, string? EntityName, string? EntityId, DateTime PerformedAt, string? Details);

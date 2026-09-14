namespace JCS.Application.DTOs.AuditLog;

public record CreateAuditLogDto(string Action, string PerformedBy, string? EntityName, string? EntityId, string? Details);

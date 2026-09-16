using JCS.Domain.Enum;

namespace JCS.Application.DTOs.AuditLog;

public class AuditLogDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public Auxiliary? Auxiliary { get; set; }
    public string? EntityName { get; set; }
    public string? EntityId { get; set; }
    public DateTime PerformedAt { get; set; }
    public string? Details { get; set; }
}

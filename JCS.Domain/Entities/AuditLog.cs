using JCS.Domain.Enum;

namespace JCS.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public Auxiliary? Auxiliary { get; set; }
    public string? EntityName { get; set; }
    public string? EntityId { get; set; }
    public DateTime PerformedAt { get; set; } = DateTime.UtcNow;
    public string? Details { get; set; }
}

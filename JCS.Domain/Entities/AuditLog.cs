namespace JCS.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public string? EntityName { get; set; }
    public string? EntityId { get; set; }
    public DateTime PerformedAt { get; set; }
    public string? Details { get; set; }
}

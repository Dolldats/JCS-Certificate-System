using JCS.Domain.Enum;

namespace JCS.Domain.Entities;

public class AdminAssignment
{
    public Guid Id { get; set; }
    public string MembershipId { get; set; } = string.Empty;
    public Auxiliary Auxiliary { get; set; }
    public AdminRole Role { get; set; } = AdminRole.GeneralAdmin;
    public AdminStatus Status { get; set; } = AdminStatus.Active;
    public string AssignedBy { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public string? RevokedBy { get; set; }
    public DateTime? RevokedAt { get; set; }
}

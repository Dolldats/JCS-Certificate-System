using JCS.Domain.Enum;

namespace JCS.Application.DTOs.AdminAssignment;

public class AdminAssignmentDto
{
    public Guid Id { get; set; }
    public string MembershipId { get; set; } = string.Empty;
    public Auxiliary Auxiliary { get; set; }
    public AdminRole Role { get; set; }
    public AdminStatus Status { get; set; }
    public string AssignedBy { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
    public string? RevokedBy { get; set; }
    public DateTime? RevokedAt { get; set; }
}

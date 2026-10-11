using JCS.Domain.Enum;

namespace JCS.Application.DTOs.AdminAssignment;

public class AdminAssignmentDto
{
    public Guid Id { get; set; }
    public string MembershipId { get; set; } = string.Empty;
    public string? MemberName { get; set; }
    public Auxiliary Auxiliary { get; set; }
    public AdminRole Role { get; set; }
    public AdminStatus Status { get; set; }
    public string AssignedBy { get; set; } = string.Empty;
    public string? AssignedByName { get; set; }
    public DateTime AssignedAt { get; set; }
    public string? RevokedBy { get; set; }
    public string? RevokedByName { get; set; }
    public DateTime? RevokedAt { get; set; }
}

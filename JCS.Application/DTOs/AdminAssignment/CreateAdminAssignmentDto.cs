using JCS.Domain.Enum;

namespace JCS.Application.DTOs.AdminAssignment;

public sealed class CreateAdminAssignmentDto
{
    public string MembershipId { get; set; } = string.Empty;
    public Auxiliary Auxiliary { get; set; }
    public string AssignedBy { get; set; } = string.Empty;
}

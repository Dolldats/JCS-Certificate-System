using JCS.Domain.Enum;

namespace JCS.Application.DTOs.AdminAssignment;

public class CreateAdminAssignmentDto
{
    public string MembershipId { get; set; } = string.Empty;
    public Auxiliary Auxiliary { get; set; }
    public AdminRole Role { get; set; } = AdminRole.GeneralAdmin;
    public string AssignedBy { get; set; } = string.Empty;
}

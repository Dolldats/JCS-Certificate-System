using JCS.Domain.Enum;

namespace JCS.Application.DTOs.AdminAssignment;

public class UpdateAdminAssignmentDto
{
    public Auxiliary Auxiliary { get; set; }
    public AdminRole Role { get; set; }
    public AdminStatus Status { get; set; }
    public string? RevokedBy { get; set; }
}

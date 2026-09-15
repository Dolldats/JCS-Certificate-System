using JCS.Domain.Enum;

namespace JCS.Application.DTOs.AdminAssignment;

public sealed class UpdateAdminAssignmentDto
{
    public Auxiliary Auxiliary { get; set; }
    public AdminStatus Status { get; set; }
    public string? RevokedBy { get; set; }
}

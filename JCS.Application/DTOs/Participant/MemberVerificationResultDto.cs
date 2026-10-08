using JCS.Domain.Enum;

namespace JCS.Application.DTOs.Participant;

public class MemberVerificationResultDto
{
    public string MembershipId { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public Auxiliary? Auxiliary { get; set; }
    public string? Jamaat { get; set; }
    public string? Dila { get; set; }
    public string? Ilaqa { get; set; }
    public VerificationStatus Status { get; set; }
    public string? Message { get; set; }
}

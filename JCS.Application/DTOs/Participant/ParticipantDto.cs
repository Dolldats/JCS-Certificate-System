using JCS.Domain.Enum;

namespace JCS.Application.DTOs.Participant;

public class ParticipantDto
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public string MembershipId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Jamaat { get; set; }
    public string? Dila { get; set; }
    public string? Ilaqa { get; set; }
    public Auxiliary Auxiliary { get; set; }
    public bool IsVerified { get; set; }
    public VerificationStatus VerificationStatus { get; set; }
    public string? VerificationMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? VerifiedAt { get; set; }
}

using JCS.Domain.Enum;

namespace JCS.Domain.Entities;

public class Participant
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
    public VerificationStatus VerificationStatus { get; set; } = VerificationStatus.Pending;
    public string? VerificationMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? VerifiedAt { get; set; }

    public Event? Event { get; set; }
    public ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();
}

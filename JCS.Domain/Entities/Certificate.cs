using JCS.Domain.Enum;

namespace JCS.Domain.Entities;

public class Certificate
{
    public Guid Id { get; set; }
    public string CertificateNumber { get; set; } = string.Empty;
    public Guid ParticipantId { get; set; }
    public Guid EventId { get; set; }
    public Guid CertificateTemplateId { get; set; }
    public CertificateType CertificateType { get; set; } = CertificateType.Participation;
    public CertificateStatus Status { get; set; } = CertificateStatus.Generated;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public DateTime? IssuedAt { get; set; }
    public string? FilePath { get; set; }
    public string? RevocationReason { get; set; }
    public string? RevokedBy { get; set; }
    public DateTime? RevokedAt { get; set; }
    public Participant? Participant { get; set; }
    public Event? Event { get; set; }
    public CertificateTemplate? CertificateTemplate { get; set; }
}

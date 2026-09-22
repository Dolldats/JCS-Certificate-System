using JCS.Domain.Enum;

namespace JCS.Application.DTOs.Certificate;

public class CertificateDto
{
    public Guid Id { get; set; }
    public string CertificateNumber { get; set; } = string.Empty;
    public Guid ParticipantId { get; set; }
    public string? ParticipantName { get; set; }
    public string? ParticipantMembershipId { get; set; }
    public Guid EventId { get; set; }
    public string? EventName { get; set; }
    public Guid CertificateTemplateId { get; set; }
    public string? TemplateName { get; set; }
    public CertificateType CertificateType { get; set; }
    public CertificateStatus Status { get; set; }
    public DateTime GeneratedAt { get; set; }
    public DateTime? IssuedAt { get; set; }
    public string? FilePath { get; set; }
    public string? RevocationReason { get; set; }
    public string? RevokedBy { get; set; }
    public DateTime? RevokedAt { get; set; }
}

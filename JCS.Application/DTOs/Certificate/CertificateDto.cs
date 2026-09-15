namespace JCS.Application.DTOs.Certificate;

public sealed class CertificateDto
{
    public Guid Id { get; set; }
    public string CertificateNumber { get; set; } = string.Empty;
    public Guid ParticipantId { get; set; }
    public Guid EventId { get; set; }
    public Guid CertificateTemplateId { get; set; }
    public string CertificateType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public string? FilePath { get; set; }
}

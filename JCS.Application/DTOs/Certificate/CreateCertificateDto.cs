namespace JCS.Application.DTOs.Certificate;

public sealed class CreateCertificateDto
{
    public string CertificateNumber { get; set; } = string.Empty;
    public Guid ParticipantId { get; set; }
    public Guid EventId { get; set; }
    public Guid CertificateTemplateId { get; set; }
    public string CertificateType { get; set; } = string.Empty;
}

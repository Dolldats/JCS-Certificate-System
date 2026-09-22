using JCS.Domain.Enum;

namespace JCS.Application.DTOs.Certificate;

public class CreateCertificateDto
{
    public string CertificateNumber { get; set; } = string.Empty;
    public Guid ParticipantId { get; set; }
    public Guid EventId { get; set; }
    public Guid CertificateTemplateId { get; set; }
    public CertificateType CertificateType { get; set; }
}

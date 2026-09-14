namespace JCS.Application.DTOs.Certificate;

public record CreateCertificateDto(string CertificateNumber, Guid ParticipantId, Guid EventId, Guid CertificateTemplateId, string CertificateType);

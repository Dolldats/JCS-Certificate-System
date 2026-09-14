namespace JCS.Application.DTOs.Certificate;

public record CertificateDto(Guid Id, string CertificateNumber, Guid ParticipantId, Guid EventId, Guid CertificateTemplateId, string CertificateType, string Status, DateTime GeneratedAt, string? FilePath);

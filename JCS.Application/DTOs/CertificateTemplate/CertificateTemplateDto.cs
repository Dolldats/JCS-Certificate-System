namespace JCS.Application.DTOs.CertificateTemplate;

public record CertificateTemplateDto(Guid Id, string Name, string? Description, string FilePath, string? ConfigurationJson, bool IsActive);

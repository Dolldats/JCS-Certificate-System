namespace JCS.Application.DTOs.CertificateTemplate;

public record UpdateCertificateTemplateDto(string Name, string? Description, string FilePath, string? ConfigurationJson, bool IsActive);

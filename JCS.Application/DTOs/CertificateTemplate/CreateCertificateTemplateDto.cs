namespace JCS.Application.DTOs.CertificateTemplate;

public record CreateCertificateTemplateDto(string Name, string? Description, string FilePath, string? ConfigurationJson);

namespace JCS.Application.DTOs.CertificateTemplate;

public sealed class CreateCertificateTemplateDto {
    public string Name { get; set; } = string.Empty; 
    public string? Description { get; set; } 
    public string FilePath { get; set; } = string.Empty; 
    public string? ConfigurationJson { get; set; } 
}

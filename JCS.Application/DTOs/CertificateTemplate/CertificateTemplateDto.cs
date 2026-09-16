using JCS.Domain.Enum;

namespace JCS.Application.DTOs.CertificateTemplate;

public class CertificateTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Auxiliary? Auxiliary { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string? ConfigurationJson { get; set; }
    public string Orientation { get; set; } = "Landscape";
    public string PageSize { get; set; } = "A4";
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

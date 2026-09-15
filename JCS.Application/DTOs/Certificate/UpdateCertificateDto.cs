namespace JCS.Application.DTOs.Certificate;

public sealed class UpdateCertificateDto
{
    public string Status { get; set; } = string.Empty;
    public string? FilePath { get; set; }
}

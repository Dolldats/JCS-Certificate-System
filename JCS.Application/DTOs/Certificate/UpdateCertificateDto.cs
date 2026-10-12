using JCS.Domain.Enum;

namespace JCS.Application.DTOs.Certificate;

public class UpdateCertificateDto
{
    public CertificateStatus Status { get; set; }
    public string? FilePath { get; set; }
    public string? RevocationReason { get; set; }
    public string? RevokedBy { get; set; }
}

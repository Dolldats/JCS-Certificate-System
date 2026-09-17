using JCS.Application.DTOs.CertificateTemplate;

namespace JCS.Application.Interfaces.Services;

public interface ICertificateRenderer
{
    byte[] RenderPdf(
        TemplateLayoutDto layout, 
        IReadOnlyDictionary<string, string?> values,
        decimal width = 1122,
        decimal height = 793);
}

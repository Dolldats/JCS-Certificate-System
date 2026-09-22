using JCS.Application.DTOs.CertificateTemplate;

namespace JCS.Application.Interfaces.Services;

public interface ICertificateRenderer
{
    byte[] RenderPdf(
        TemplateLayoutDto layout, 
        IReadOnlyDictionary<string, string?> values,
        decimal width = 1122,
        decimal height = 793);
    byte[] RenderPdfBatch(IReadOnlyCollection<CertificateRenderRequest> requests);
}

public record CertificateRenderRequest(TemplateLayoutDto Layout, IReadOnlyDictionary<string, string?> Values, decimal Width = 1122, decimal Height = 793, string? BackgroundImagePath = null);


using JCS.Application.DTOs.CertificateTemplate;
using JCS.Application.Interfaces.Services;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace JCS.Application.Services;

public class CertificateRenderer : ICertificateRenderer
{
    public byte[] RenderPdf(TemplateLayoutDto layout, IReadOnlyDictionary<string, string?> values, decimal width = 1122, decimal height = 793)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        return Document.Create(document =>
        {
            document.Page(page =>
            {
                page.Size((float)width, (float)height);
                page.Margin(0);
                page.Content().Layers(layers =>
                {
                    layers.PrimaryLayer().Background(Colors.White);
                    foreach (var element in layout.TextElements)
                    {
                        var content = values.TryGetValue(element.Placeholder, out var value) ? value : element.Placeholder;
                        var text = layers.Layer().TranslateX((float)element.X).TranslateY((float)element.Y).Text(content ?? string.Empty)
                            .FontFamily(element.FontFamily)
                            .FontSize((float)element.FontSize)
                            .FontColor(element.TextColor);

                        if (element.Bold)
                        {
                            text.Bold();
                        }

                        if (element.Italic)
                        {
                            text.Italic();
                        }
                    }
                });
            });
        }).GeneratePdf();
    }
}

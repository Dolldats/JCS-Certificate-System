using JCS.Application.DTOs.CertificateTemplate;
using JCS.Application.Interfaces.Services;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace JCS.Application.Services;

public class CertificateRenderer : ICertificateRenderer
{
    public byte[] RenderPdfBatch(IReadOnlyCollection<CertificateRenderRequest> requests)
    {
        QuestPDF.Settings.License = LicenseType.Community;
        return Document.Create(document =>
        {
            foreach (var request in requests)
            {
                document.Page(page =>
                {
                    page.Size((float)request.Width, (float)request.Height);
                    page.Margin(0);
                    page.Content().Layers(layers =>
                    {
                        layers.PrimaryLayer().Background(Colors.White);
                        if (!string.IsNullOrWhiteSpace(request.BackgroundImagePath) && File.Exists(request.BackgroundImagePath))
                        {
                            layers.PrimaryLayer().Image(File.ReadAllBytes(request.BackgroundImagePath)).FitArea();
                        }
                        if (request.Layout.TextElements != null)
                        {
                            foreach (var element in request.Layout.TextElements)
                            {
                                var content = request.Values.TryGetValue(element.Placeholder, out var value) ? value : element.Placeholder;
                                var textColor = string.IsNullOrWhiteSpace(element.TextColor) ? "#000000" : element.TextColor;
                                var fontFamily = string.IsNullOrWhiteSpace(element.FontFamily) ? "Arial" : element.FontFamily;
                                var fontSize = element.FontSize > 0 ? (float)element.FontSize : 12f;
                                var text = layers.Layer().TranslateX((float)element.X).TranslateY((float)element.Y).Text(content ?? string.Empty).FontFamily(fontFamily).FontSize(fontSize).FontColor(textColor);
                                if (element.Bold) text.Bold();
                                if (element.Italic) text.Italic();
                            }
                        }
                    });
                });
            }
        }).GeneratePdf();
    }

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
                    if (layout.TextElements != null)
                    {
                        foreach (var element in layout.TextElements)
                        {
                            var content = values.TryGetValue(element.Placeholder, out var value) ? value : element.Placeholder;
                            var textColor = string.IsNullOrWhiteSpace(element.TextColor) ? "#000000" : element.TextColor;
                            var fontFamily = string.IsNullOrWhiteSpace(element.FontFamily) ? "Arial" : element.FontFamily;
                            var fontSize = element.FontSize > 0 ? (float)element.FontSize : 12f;
                            var text = layers.Layer().TranslateX((float)element.X).TranslateY((float)element.Y).Text(content ?? string.Empty)
                                .FontFamily(fontFamily)
                                .FontSize(fontSize)
                                .FontColor(textColor);

                            if (element.Bold)
                            {
                                text.Bold();
                            }

                            if (element.Italic)
                            {
                                text.Italic();
                            }
                        }
                    }
                });
            });
        }).GeneratePdf();
    }
}

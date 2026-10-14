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
                        foreach (var element in GetTextElements(request.Layout))
                        {
                            var content = request.Values.TryGetValue(element.Placeholder, out var value) ? value : element.Placeholder;
                            var textColor = string.IsNullOrWhiteSpace(element.TextColor) ? "#000000" : element.TextColor;
                            var fontFamily = string.IsNullOrWhiteSpace(element.FontFamily) ? "Arial" : element.FontFamily;
                            var fontSize = element.FontSize > 0 ? (float)element.FontSize : 12f;
                            var text = layers.Layer().TranslateX((float)element.X).TranslateY((float)element.Y).Text(content ?? string.Empty).FontFamily(fontFamily).FontSize(fontSize).FontColor(textColor);
                            if (element.Bold) text.Bold();
                            if (element.Italic) text.Italic();
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
                    foreach (var element in GetTextElements(layout))
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
                });
            });
        }).GeneratePdf();
    }

    // Older saved templates contain visual editor settings but no renderer text elements.
    // Use a basic certificate layout so those templates still produce a readable PDF.
    private static IReadOnlyList<TemplateTextElementDto> GetTextElements(TemplateLayoutDto layout)
    {
        var textElements = layout.TextElements?.ToList() ?? new List<TemplateTextElementDto>();
        if (textElements.Count == 0)
        {
            textElements.AddRange(new[]
            {
                new TemplateTextElementDto { Placeholder = "CERTIFICATE OF PARTICIPATION", X = 0, Y = 110, FontFamily = "Arial", FontSize = 28, Bold = true, TextColor = "#0F5132", Alignment = "Center" },
                new TemplateTextElementDto { Placeholder = "EventName", X = 0, Y = 190, FontFamily = "Arial", FontSize = 24, Bold = true, TextColor = "#0F5132", Alignment = "Center" },
                new TemplateTextElementDto { Placeholder = "ParticipantName", X = 0, Y = 350, FontFamily = "Arial", FontSize = 32, Bold = true, TextColor = "#111827", Alignment = "Center" },
                new TemplateTextElementDto { Placeholder = "CertificateNumber", X = 0, Y = 640, FontFamily = "Arial", FontSize = 14, TextColor = "#475569", Alignment = "Center" }
            });
        }

        // Include the participant's Dila and Jama'at if the saved layout has no slots for them.
        if (!textElements.Any(element => new[] { "Dila", "Dilla", "DilaLine" }.Contains(element.Placeholder, StringComparer.OrdinalIgnoreCase)))
        {
            textElements.Add(new TemplateTextElementDto { Placeholder = "DilaLine", X = 0, Y = 420, FontFamily = "Arial", FontSize = 16, TextColor = "#334155", Alignment = "Center" });
        }
        if (!textElements.Any(element => new[] { "Jamaat", "JamaatLine" }.Contains(element.Placeholder, StringComparer.OrdinalIgnoreCase)))
        {
            textElements.Add(new TemplateTextElementDto { Placeholder = "JamaatLine", X = 0, Y = 455, FontFamily = "Arial", FontSize = 16, TextColor = "#334155", Alignment = "Center" });
        }

        return textElements;
    }
}

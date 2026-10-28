using JCS.Application.DTOs.CertificateTemplate;
using JCS.Application.Interfaces.Services;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QRCoder;

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
                        AddImages(layers, request.Layout);
                        AddQrCode(layers, request.VerificationUrl, request.Width, request.Height);
                        if (request.Layout.TextElements != null)
                        {
                            foreach (var element in request.Layout.TextElements)
                            {
                                var content = GetValue(request.Values, element.Placeholder);
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

    private static void AddQrCode(LayersDescriptor layers, string? verificationUrl, decimal width, decimal height)
    {
        if (string.IsNullOrWhiteSpace(verificationUrl)) return;

        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(verificationUrl, QRCodeGenerator.ECCLevel.Q);
        var png = new PngByteQRCode(data).GetGraphic(5);
        const float size = 96;
        layers.Layer()
            .TranslateX(Math.Max(0, (float)width - size - 18))
            .TranslateY(Math.Max(0, (float)height - size - 18))
            .Width(size)
            .Height(size)
            .Image(png)
            .FitArea();
    }

    public byte[] RenderPdf(TemplateLayoutDto layout, IReadOnlyDictionary<string, string?> values, decimal width = 1122, decimal height = 793, string? backgroundImagePath = null, string? verificationUrl = null)
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
                    if (!string.IsNullOrWhiteSpace(backgroundImagePath) && File.Exists(backgroundImagePath))
                    {
                        layers.PrimaryLayer().Image(File.ReadAllBytes(backgroundImagePath)).FitArea();
                    }
                    AddImages(layers, layout);
                    AddQrCode(layers, verificationUrl, width, height);
                    if (layout.TextElements != null)
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
                            var content = GetValue(values, element.Placeholder);
                            var textColor = string.IsNullOrWhiteSpace(element.TextColor) ? "#000000" : element.TextColor;
                            var fontFamily = string.IsNullOrWhiteSpace(element.FontFamily) ? "Arial" : element.FontFamily;
                            var fontSize = element.FontSize > 0 ? (float)element.FontSize : 12f;
                            var text = layers.Layer().TranslateX((float)element.X).TranslateY((float)element.Y).Text(content ?? string.Empty)
                                .FontFamily(fontFamily)
                                .FontSize(fontSize)
                                .FontColor(textColor);

                        if (element.Italic)
                        {
                            text.Italic();
                        }
                    }
                });
            });
        }).GeneratePdf();
    }

    private static void AddImages(LayersDescriptor layers, TemplateLayoutDto layout)
    {
        if (layout.ImageElements == null)
        {
            return;
        }

        foreach (var element in layout.ImageElements)
        {
            if (string.IsNullOrWhiteSpace(element.AssetKey) || !File.Exists(element.AssetKey))
            {
                continue;
            }

            layers.Layer()
                .TranslateX((float)element.X)
                .TranslateY((float)element.Y)
                .Width((float)element.Width)
                .Height((float)element.Height)
                .Image(File.ReadAllBytes(element.AssetKey))
                .FitArea();
        }
    }

    private static string? GetValue(IReadOnlyDictionary<string, string?> values, string placeholder)
    {
        var match = values.FirstOrDefault(x => string.Equals(x.Key, placeholder, StringComparison.OrdinalIgnoreCase));
        return match.Key == null ? placeholder : match.Value;
    }
}

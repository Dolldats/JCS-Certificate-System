namespace JCS.Application.DTOs.CertificateTemplate;

public class TemplateLayoutDto
{
    public List<TemplateTextElementDto> TextElements { get; set; } = new();
    public List<TemplateImageElementDto> ImageElements { get; set; } = new();
}

public class TemplateTextElementDto
{
    public string Placeholder { get; set; } = string.Empty;
    public decimal X { get; set; }
    public decimal Y { get; set; }
    public string FontFamily { get; set; } = "Arial";
    public decimal FontSize { get; set; } = 12;
    public bool Bold { get; set; }
    public bool Italic { get; set; }
    public string TextColor { get; set; } = "#000000";
    public string Alignment { get; set; } = "Left";
}

public class TemplateImageElementDto
{
    public string AssetKey { get; set; } = string.Empty;
    public decimal X { get; set; }
    public decimal Y { get; set; }
    public decimal Width { get; set; }
    public decimal Height { get; set; }
}

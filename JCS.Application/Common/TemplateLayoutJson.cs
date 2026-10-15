using System.Text.Json;
using JCS.Application.DTOs.CertificateTemplate;

namespace JCS.Application.Common;

public static class TemplateLayoutJson
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static TemplateLayoutDto Deserialize(string? configurationJson)
    {
        if (string.IsNullOrWhiteSpace(configurationJson))
        {
            return new TemplateLayoutDto();
        }

        return JsonSerializer.Deserialize<TemplateLayoutDto>(configurationJson, Options) ?? new TemplateLayoutDto();
    }
}

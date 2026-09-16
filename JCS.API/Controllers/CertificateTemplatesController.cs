using JCS.Application.DTOs.CertificateTemplate;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Enum;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text;
using System.Security;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CertificateTemplatesController : ControllerBase
{
    private readonly ICertificateTemplateService _certificateTemplateService;
    private readonly IAssetStorageService _assetStorageService;
    private readonly IPlaceholderEngine _placeholderEngine;

    public CertificateTemplatesController(ICertificateTemplateService certificateTemplateService, IAssetStorageService assetStorageService, IPlaceholderEngine placeholderEngine)
    {
        _certificateTemplateService = certificateTemplateService;
        _assetStorageService = assetStorageService;
        _placeholderEngine = placeholderEngine;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllTemplates(CancellationToken token)
    {
        var templates = await _certificateTemplateService.GetAllAsync(token);
        return Ok(templates);
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActiveTemplates([FromQuery] Auxiliary? auxiliary, CancellationToken token)
    {
        var templates = await _certificateTemplateService.GetActiveTemplatesAsync(auxiliary, token);
        return Ok(templates);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTemplateById(Guid id, CancellationToken token)
    {
        var result = await _certificateTemplateService.GetByIdAsync(id, token);
        if (result == null)
        {
            return NotFound(new { message = $"Template with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateCertificateTemplateDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!IsValidLayout(dto.ConfigurationJson, out var error))
        {
            return BadRequest(new { message = error });
        }

        var result = await _certificateTemplateService.CreateAsync(dto, token);
        return CreatedAtAction(nameof(GetTemplateById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTemplate(Guid id, [FromBody] UpdateCertificateTemplateDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!IsValidLayout(dto.ConfigurationJson, out var error))
        {
            return BadRequest(new { message = error });
        }

        var result = await _certificateTemplateService.UpdateAsync(id, dto, token);
        if (result == null)
        {
            return NotFound(new { message = $"Template with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTemplate(Guid id, CancellationToken token)
    {
        var deleted = await _certificateTemplateService.DeleteAsync(id, token);
        if (!deleted)
        {
            return NotFound(new { message = $"Template with id {id} not found." });
        }

        return NoContent();
    }

    [HttpPost("assets")]
    public async Task<IActionResult> UploadAsset([FromForm] IFormFile file, [FromForm] string folder = "templates", CancellationToken token = default)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "A non-empty asset file is required." });
        }

        var path = await _assetStorageService.SaveAsync(file.OpenReadStream(), file.FileName, folder, token);
        return Ok(new { path });
    }

    [HttpPost("preview")]
    public IActionResult Preview([FromBody] TemplatePreviewRequest request)
    {
        if (!IsValidLayout(request.ConfigurationJson, out var error))
        {
            return BadRequest(new { message = error });
        }

        var layout = JsonSerializer.Deserialize<TemplateLayoutDto>(request.ConfigurationJson) ?? new TemplateLayoutDto();
        var values = new Dictionary<string, string?>
        {
            ["ParticipantName"] = "Sample Participant",
            ["EventName"] = "Jama'at Certificate Event",
            ["EventDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            ["CertificateNumber"] = "JCS-SAMPLE-2026-0001",
            ["Jamaat"] = "Sample Jamaat",
            ["Auxiliary"] = "Sample Auxiliary",
            ["IssueDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd")
        };

        var svg = BuildSvg(layout, values);
        return Content(svg, "image/svg+xml", Encoding.UTF8);
    }

    private static bool IsValidLayout(string? configurationJson, out string error)
    {
        error = string.Empty;
        if (string.IsNullOrWhiteSpace(configurationJson))
        {
            return true;
        }

        try
        {
            var layout = JsonSerializer.Deserialize<TemplateLayoutDto>(configurationJson);
            if (layout == null)
            {
                error = "ConfigurationJson must contain a template layout.";
                return false;
            }

            var supported = new[] { "ParticipantName", "EventName", "EventDate", "CertificateNumber", "Jamaat", "Auxiliary", "IssueDate" };
            foreach (var element in layout.TextElements)
            {
                if (!supported.Contains(element.Placeholder, StringComparer.OrdinalIgnoreCase))
                {
                    error = $"Unsupported placeholder: {element.Placeholder}.";
                    return false;
                }

                if (element.X < 0 || element.Y < 0 || element.FontSize <= 0)
                {
                    error = "Text coordinates must be non-negative and FontSize must be greater than zero.";
                    return false;
                }
            }

            foreach (var element in layout.ImageElements)
            {
                if (element.X < 0 || element.Y < 0 || element.Width <= 0 || element.Height <= 0)
                {
                    error = "Image coordinates and dimensions must be positive.";
                    return false;
                }
            }

            return true;
        }
        catch (JsonException)
        {
            error = "ConfigurationJson must be valid template layout JSON.";
            return false;
        }
    }

    private string BuildSvg(TemplateLayoutDto layout, IReadOnlyDictionary<string, string?> values)
    {
        const decimal width = 1122;
        const decimal height = 793;
        var svg = new StringBuilder($"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{width}\" height=\"{height}\" viewBox=\"0 0 {width} {height}\">");
        svg.Append("<rect width=\"100%\" height=\"100%\" fill=\"white\"/>");

        foreach (var image in layout.ImageElements)
        {
            var source = SecurityElement.Escape(image.AssetKey) ?? string.Empty;
            svg.Append($"<image href=\"{source}\" x=\"{image.X}\" y=\"{image.Y}\" width=\"{image.Width}\" height=\"{image.Height}\" preserveAspectRatio=\"xMidYMid meet\"/>");
        }

        foreach (var text in layout.TextElements)
        {
            var content = values.TryGetValue(text.Placeholder, out var value) ? value : text.Placeholder;
            var escaped = SecurityElement.Escape(content ?? string.Empty);
            var weight = text.Bold ? "font-weight=\"bold\"" : string.Empty;
            var style = text.Italic ? "font-style=\"italic\"" : string.Empty;
            svg.Append($"<text x=\"{text.X}\" y=\"{text.Y}\" fill=\"{SecurityElement.Escape(text.TextColor)}\" font-family=\"{SecurityElement.Escape(text.FontFamily)}\" font-size=\"{text.FontSize}\" text-anchor=\"{GetAnchor(text.Alignment)}\" {weight} {style}>{escaped}</text>");
        }

        svg.Append("</svg>");
        return svg.ToString();
    }

    private static string GetAnchor(string alignment)
    {
        return alignment.ToLowerInvariant() switch
        {
            "center" => "middle",
            "right" => "end",
            _ => "start"
        };
    }
}

public class TemplatePreviewRequest
{
    public string ConfigurationJson { get; set; } = string.Empty;
}

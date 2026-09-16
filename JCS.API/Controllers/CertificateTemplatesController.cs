using JCS.Application.DTOs.CertificateTemplate;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Enum;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

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

        return Ok(new { renderedConfiguration = _placeholderEngine.Replace(request.ConfigurationJson, values), values });
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
            JsonSerializer.Deserialize<TemplateLayoutDto>(configurationJson);
            return true;
        }
        catch (JsonException)
        {
            error = "ConfigurationJson must be valid template layout JSON.";
            return false;
        }
    }
}

public class TemplatePreviewRequest
{
    public string ConfigurationJson { get; set; } = string.Empty;
}

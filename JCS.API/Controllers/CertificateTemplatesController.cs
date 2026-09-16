using JCS.Application.DTOs.CertificateTemplate;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Enum;
using Microsoft.AspNetCore.Mvc;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CertificateTemplatesController : ControllerBase
{
    private readonly ICertificateTemplateService _certificateTemplateService;

    public CertificateTemplatesController(ICertificateTemplateService certificateTemplateService)
    {
        _certificateTemplateService = certificateTemplateService;
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
}

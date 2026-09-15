using JCS.Application.DTOs.CertificateTemplate;
using JCS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CertificateTemplatesController : ControllerBase
{
    private readonly ICertificateTemplateService _service;
    public CertificateTemplatesController(ICertificateTemplateService service) 
    { 
        _service = service; 
    }

    [HttpGet]
    public async Task<IActionResult> GetAllTemplates(CancellationToken token) 
    {
        return Ok(await _service.GetAllAsync(token));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTemplateById(Guid id, CancellationToken token)
    {
        var result = await _service.GetByIdAsync(id, token);

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
        
        var result = await _service.CreateAsync(dto, token);
        return CreatedAtAction(nameof(GetTemplateById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTemplate(Guid id, [FromBody] UpdateCertificateTemplateDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _service.UpdateAsync(id, dto, token);

        if (result == null)
        {
            return NotFound(new { message = $"Template with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTemplate(Guid id, CancellationToken token)
    {
        if (!await _service.DeleteAsync(id, token))
        {
            return NotFound(new { message = $"Template with id {id} not found." });
        }

        return NoContent();
    }
}

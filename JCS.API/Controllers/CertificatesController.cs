using JCS.Application.DTOs.Certificate;
using JCS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CertificatesController : ControllerBase
{
    private readonly ICertificateService _service;
    public CertificatesController(ICertificateService service) { _service = service; }

    [HttpGet]
    public async Task<IActionResult> GetAllCertificates(CancellationToken token) 
    {
        return Ok(await _service.GetAllAsync(token)); 
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCertificateById(Guid id, CancellationToken token)
    {
        var result = await _service.GetByIdAsync(id, token);

        if (result == null) return NotFound(new { message = $"Certificate with id {id} not found." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCertificate([FromBody] CreateCertificateDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _service.CreateAsync(dto, token);
        return CreatedAtAction(nameof(GetCertificateById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCertificate(Guid id, [FromBody] UpdateCertificateDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _service.UpdateAsync(id, dto, token);
        if (result == null) return NotFound(new { message = $"Certificate with id {id} not found." });
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCertificate(Guid id, CancellationToken token)
    {
        if (!await _service.DeleteAsync(id, token)) return NotFound(new { message = $"Certificate with id {id} not found." });
        return NoContent();
    }
}

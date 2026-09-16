using JCS.Application.DTOs.Certificate;
using JCS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CertificatesController : ControllerBase
{
    private readonly ICertificateService _certificateService;

    public CertificatesController(ICertificateService certificateService)
    {
        _certificateService = certificateService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllCertificates(CancellationToken token)
    {
        var certificates = await _certificateService.GetAllAsync(token);
        return Ok(certificates);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCertificateById(Guid id, CancellationToken token)
    {
        var result = await _certificateService.GetByIdAsync(id, token);
        if (result == null)
        {
            return NotFound(new { message = $"Certificate with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpGet("verify/{certificateNumber}")]
    public async Task<IActionResult> GetByCertificateNumber(string certificateNumber, CancellationToken token)
    {
        var result = await _certificateService.GetByCertificateNumberAsync(certificateNumber, token);
        if (result == null)
        {
            return NotFound(new { message = $"Certificate with number {certificateNumber} not found." });
        }

        return Ok(result);
    }

    [HttpGet("event/{eventId:guid}")]
    public async Task<IActionResult> GetCertificatesByEvent(Guid eventId, CancellationToken token)
    {
        var certificates = await _certificateService.GetByEventIdAsync(eventId, token);
        return Ok(certificates);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCertificate([FromBody] CreateCertificateDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _certificateService.CreateAsync(dto, token);
        return CreatedAtAction(nameof(GetCertificateById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCertificate(Guid id, [FromBody] UpdateCertificateDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _certificateService.UpdateAsync(id, dto, token);
        if (result == null)
        {
            return NotFound(new { message = $"Certificate with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCertificate(Guid id, CancellationToken token)
    {
        var deleted = await _certificateService.DeleteAsync(id, token);
        if (!deleted)
        {
            return NotFound(new { message = $"Certificate with id {id} not found." });
        }

        return NoContent();
    }
}

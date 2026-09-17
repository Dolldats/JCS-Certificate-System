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

        return Ok(new
        {
            authenticity = result.Status == JCS.Domain.Enum.CertificateStatus.Revoked ? "Revoked" : "Authentic",
            certificate = result
        });
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

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> DownloadCertificate(Guid id, CancellationToken token)
    {
        var certificate = await _certificateService.GetByIdAsync(id, token);
        if (certificate == null)
        {
            return NotFound(new { message = $"Certificate with id {id} not found." });
        }

        if (string.IsNullOrWhiteSpace(certificate.FilePath) || !System.IO.File.Exists(certificate.FilePath))
        {
            return NotFound(new { message = "The certificate file has not been generated yet." });
        }

        var contentType = Path.GetExtension(certificate.FilePath).ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            _ => "application/octet-stream"
        };

        return PhysicalFile(certificate.FilePath, contentType, $"{certificate.CertificateNumber}{Path.GetExtension(certificate.FilePath)}");
    }
}

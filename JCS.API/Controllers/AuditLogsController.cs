using JCS.Application.DTOs.AuditLog;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Enum;
using Microsoft.AspNetCore.Mvc;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _service;
    public AuditLogsController(IAuditLogService service) { _service = service; }

    [HttpGet]
    public async Task<IActionResult> GetAllAuditLogs(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string? performedBy,
        [FromQuery] string? action,
        [FromQuery] Auxiliary? auxiliary,
        CancellationToken token)
    {
        if (from.HasValue || to.HasValue || !string.IsNullOrWhiteSpace(performedBy) || !string.IsNullOrWhiteSpace(action) || auxiliary.HasValue)
        {
            return Ok(await _service.GetFilteredAsync(from, to, performedBy, action, auxiliary, token));
        }
        return Ok(await _service.GetAllAsync(token));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAuditLogById(Guid id, CancellationToken token)
    {
        var result = await _service.GetByIdAsync(id, token);
        return result is null ? NotFound(new { message = $"Audit log with id {id} not found." }) : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAuditLog([FromBody] CreateAuditLogDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _service.CreateAsync(dto, token);
        return CreatedAtAction(nameof(GetAuditLogById), new { id = result.Id }, result);
    }
}

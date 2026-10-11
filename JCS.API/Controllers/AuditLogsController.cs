using JCS.Application.DTOs.AuditLog;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Enum;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using JCS.API.Common;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogsController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllAuditLogs(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string? performedBy,
        [FromQuery] string? action,
        [FromQuery] Auxiliary? auxiliary,
        [FromQuery] PageQuery? query,
        CancellationToken token)
    {
        if (from.HasValue || to.HasValue || !string.IsNullOrWhiteSpace(performedBy) || !string.IsNullOrWhiteSpace(action) || auxiliary.HasValue)
        {
            var filteredLogs = await _auditLogService.GetFilteredAsync(from, to, performedBy, action, auxiliary, token);
            return Ok(ToPage(filteredLogs, query));
        }

        var allLogs = await _auditLogService.GetAllAsync(token);
        return Ok(ToPage(allLogs, query));
    }

    private static PagedResult<AuditLogDto> ToPage(IEnumerable<AuditLogDto> logs, PageQuery? query)
    {
        query ??= new PageQuery();
        var filtered = string.IsNullOrWhiteSpace(query.Search) ? logs : logs.Where(x => x.Action.Contains(query.Search, StringComparison.OrdinalIgnoreCase) || x.PerformedBy.Contains(query.Search, StringComparison.OrdinalIgnoreCase));
        var list = filtered.ToList();
        var items = list.OrderByDescending(x => x.PerformedAt).Skip((query.SafePage - 1) * query.SafePageSize).Take(query.SafePageSize).ToList();
        return new PagedResult<AuditLogDto>(items, query.SafePage, query.SafePageSize, list.Count);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAuditLogById(Guid id, CancellationToken token)
    {
        var result = await _auditLogService.GetByIdAsync(id, token);
        if (result == null)
        {
            return NotFound(new { message = $"Audit log with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAuditLog([FromBody] CreateAuditLogDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _auditLogService.CreateAsync(dto, token);
        return CreatedAtAction(nameof(GetAuditLogById), new { id = result.Id }, result);
    }
}

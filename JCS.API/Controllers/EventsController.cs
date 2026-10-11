using JCS.Application.DTOs.Event;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Enum;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using JCS.API.Common;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;
    private readonly IParticipantService _participantService;

    public EventsController(IEventService eventService, IParticipantService participantService)
    {
        _eventService = eventService;
        _participantService = participantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllEvents([FromQuery] PageQuery query, CancellationToken token)
    {
        var events = await _eventService.GetAllAsync(token);
        if (User.IsInRole("Member"))
        {
            var membershipId = User.Identity?.Name;
            var participantEvents = await _participantService.GetAllAsync(token);
            var eventIds = participantEvents.Where(x => string.Equals(x.MembershipId, membershipId, StringComparison.OrdinalIgnoreCase)).Select(x => x.EventId).ToHashSet();
            events = events.Where(x => eventIds.Contains(x.Id)).ToList();
        }
        else if (User.IsInRole("GeneralAdmin") && TryGetAuxiliary(out var auxiliary))
        {
            events = events.Where(x => x.Auxiliary == auxiliary).ToList();
        }
        if (!string.IsNullOrWhiteSpace(query.Search)) events = events.Where(x => x.Name.Contains(query.Search, StringComparison.OrdinalIgnoreCase) || x.Venue.Contains(query.Search, StringComparison.OrdinalIgnoreCase)).ToList();
        if (!string.IsNullOrWhiteSpace(query.Status)) events = events.Where(x => string.Equals(x.Status, query.Status, StringComparison.OrdinalIgnoreCase)).ToList();
        if (!string.IsNullOrWhiteSpace(query.Auxiliary) && Enum.TryParse<Auxiliary>(query.Auxiliary, true, out var filterAuxiliary)) events = events.Where(x => x.Auxiliary == filterAuxiliary).ToList();
        var total = events.Count;
        var items = events.OrderByDescending(x => x.EventDate).Skip((query.SafePage - 1) * query.SafePageSize).Take(query.SafePageSize).ToList();
        return Ok(new PagedResult<EventDto>(items, query.SafePage, query.SafePageSize, total));
    }

    [HttpGet("auxiliary/{auxiliary}")]
    public async Task<IActionResult> GetEventsByAuxiliary(Auxiliary auxiliary, CancellationToken token)
    {
        if (User.IsInRole("Member")) return Forbid();
        if (!CanAccessAuxiliary(auxiliary)) return Forbid();
        var events = await _eventService.GetByAuxiliaryAsync(auxiliary, token);
        return Ok(events);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetEventById(Guid id, CancellationToken token)
    {
        var result = await _eventService.GetByIdAsync(id, token);
        if (result == null)
        {
            return NotFound(new { message = $"Event with id {id} not found." });
        }

        if (!CanAccessAuxiliary(result.Auxiliary)) return Forbid();

        if (User.IsInRole("Member"))
        {
            var participation = await _participantService.GetByEventIdAsync(id, token);
            if (!participation.Any(x => string.Equals(x.MembershipId, User.Identity?.Name, StringComparison.OrdinalIgnoreCase)))
                return Forbid();
        }

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,GeneralAdmin")]
    public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (User.IsInRole("GeneralAdmin"))
        {
            var userAuxiliaryStr = User.FindFirst("Auxiliary")?.Value;
            if (userAuxiliaryStr != "None" && !string.Equals(userAuxiliaryStr, dto.Auxiliary.ToString(), StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403, new { message = "General Admins can only create events for their own auxiliary body." });
            }
        }

        if (dto.EndDate.HasValue && dto.EndDate.Value < dto.EventDate)
        {
            return BadRequest(new { message = "EndDate cannot be earlier than EventDate." });
        }

        var result = await _eventService.CreateAsync(dto, token);
        return CreatedAtAction(nameof(GetEventById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,GeneralAdmin")]
    public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateEventDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (User.IsInRole("GeneralAdmin"))
        {
            var userAuxiliaryStr = User.FindFirst("Auxiliary")?.Value;
            if (userAuxiliaryStr != "None" && !string.Equals(userAuxiliaryStr, dto.Auxiliary.ToString(), StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403, new { message = "General Admins can only create events for their own auxiliary body." });
            }
        }

        var existing = await _eventService.GetByIdAsync(id, token);
        if (existing == null) return NotFound(new { message = $"Event with id {id} not found." });
        if (!CanAccessAuxiliary(existing.Auxiliary)) return Forbid();

        if (dto.EndDate.HasValue && dto.EndDate.Value < dto.EventDate)
        {
            return BadRequest(new { message = "EndDate cannot be earlier than EventDate." });
        }

        var result = await _eventService.UpdateAsync(id, dto, token);
        if (result == null)
        {
            return NotFound(new { message = $"Event with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,GeneralAdmin")]
    public async Task<IActionResult> DeleteEvent(Guid id, CancellationToken token)
    {
        var existing = await _eventService.GetByIdAsync(id, token);
        if (existing == null) return NotFound(new { message = $"Event with id {id} not found." });
        if (!CanAccessAuxiliary(existing.Auxiliary)) return Forbid();
        var deleted = await _eventService.DeleteAsync(id, token);
        if (!deleted)
        {
            return NotFound(new { message = $"Event with id {id} not found." });
        }

        return NoContent();
    }

    private bool CanAccessAuxiliary(Auxiliary auxiliary) =>
        !User.IsInRole("GeneralAdmin") || (TryGetAuxiliary(out var userAuxiliary) && userAuxiliary == auxiliary);

    private bool TryGetAuxiliary(out Auxiliary auxiliary) =>
        Enum.TryParse(User.FindFirst("Auxiliary")?.Value, true, out auxiliary);
}

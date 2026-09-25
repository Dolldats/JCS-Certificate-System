using JCS.Application.DTOs.Event;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Enum;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

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
    public async Task<IActionResult> GetAllEvents(CancellationToken token)
    {
        var events = await _eventService.GetAllAsync(token);
        if (User.IsInRole("Member"))
        {
            var membershipId = User.Identity?.Name;
            var participantEvents = await _participantService.GetAllAsync(token);
            var eventIds = participantEvents.Where(x => string.Equals(x.MembershipId, membershipId, StringComparison.OrdinalIgnoreCase)).Select(x => x.EventId).ToHashSet();
            events = events.Where(x => eventIds.Contains(x.Id)).ToList();
        }
        return Ok(events);
    }

    [HttpGet("auxiliary/{auxiliary}")]
    public async Task<IActionResult> GetEventsByAuxiliary(Auxiliary auxiliary, CancellationToken token)
    {
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

        return Ok(result);
    }

    [HttpPost]
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
    public async Task<IActionResult> DeleteEvent(Guid id, CancellationToken token)
    {
        var deleted = await _eventService.DeleteAsync(id, token);
        if (!deleted)
        {
            return NotFound(new { message = $"Event with id {id} not found." });
        }

        return NoContent();
    }
}

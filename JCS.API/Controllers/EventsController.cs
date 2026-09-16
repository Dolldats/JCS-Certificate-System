using JCS.Application.DTOs.Event;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Enum;
using Microsoft.AspNetCore.Mvc;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;

    public EventsController(IEventService eventService)
    {
        _eventService = eventService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllEvents(CancellationToken token)
    {
        var events = await _eventService.GetAllAsync(token);
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

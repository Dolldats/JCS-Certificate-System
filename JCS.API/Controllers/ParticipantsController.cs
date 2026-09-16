using JCS.Application.DTOs.Participant;
using JCS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ParticipantsController : ControllerBase
{
    private readonly IParticipantService _participantService;

    public ParticipantsController(IParticipantService participantService)
    {
        _participantService = participantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllParticipants(CancellationToken token)
    {
        var participants = await _participantService.GetAllAsync(token);
        return Ok(participants);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetParticipantById(Guid id, CancellationToken token)
    {
        var result = await _participantService.GetByIdAsync(id, token);
        if (result == null)
        {
            return NotFound(new { message = $"Participant with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpGet("event/{eventId:guid}")]
    public async Task<IActionResult> GetParticipantsByEvent(Guid eventId, CancellationToken token)
    {
        var participants = await _participantService.GetByEventIdAsync(eventId, token);
        return Ok(participants);
    }

    [HttpPost]
    public async Task<IActionResult> CreateParticipant([FromBody] CreateParticipantDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _participantService.CreateAsync(dto, token);
        return CreatedAtAction(nameof(GetParticipantById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateParticipant(Guid id, [FromBody] UpdateParticipantDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _participantService.UpdateAsync(id, dto, token);
        if (result == null)
        {
            return NotFound(new { message = $"Participant with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteParticipant(Guid id, CancellationToken token)
    {
        var deleted = await _participantService.DeleteAsync(id, token);
        if (!deleted)
        {
            return NotFound(new { message = $"Participant with id {id} not found." });
        }

        return NoContent();
    }
}

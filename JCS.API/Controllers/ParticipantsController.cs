using JCS.Application.DTOs.Participant;
using JCS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ParticipantsController : ControllerBase
{
    private readonly IParticipantService _service;

    public ParticipantsController(IParticipantService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllParticipants(CancellationToken token)
    {
        return Ok(await _service.GetAllAsync(token));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetParticipantById(Guid id, CancellationToken token)
    {
        var result = await _service.GetByIdAsync(id, token);

        if (result == null)
        {
            return NotFound(new { message = $"Participant with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateParticipant([FromBody] CreateParticipantDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _service.CreateAsync(dto, token);
        return CreatedAtAction(nameof(GetParticipantById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateParticipant(Guid id, [FromBody] UpdateParticipantDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _service.UpdateAsync(id, dto, token);

        if (result == null)
        {
            return NotFound(new { message = $"Participant with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteParticipant(Guid id, CancellationToken token)
    {
        if (!await _service.DeleteAsync(id, token))
        {
            return NotFound(new { message = $"Participant with id {id} not found." });
        }

        return NoContent();
    }
}

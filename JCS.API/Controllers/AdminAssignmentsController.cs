using JCS.Application.DTOs.AdminAssignment;
using JCS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminAssignmentsController : ControllerBase
{
    private readonly IAdminAssignmentService _service;
    public AdminAssignmentsController(IAdminAssignmentService service) 
    {
        _service = service; 
    }

    [HttpGet]
    public async Task<IActionResult> GetAllAssignments(CancellationToken token)
    {
        return Ok(await _service.GetAllAsync(token));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAssignmentById(Guid id, CancellationToken token)
    {
        var result = await _service.GetByIdAsync(id, token);
        if (result == null)
        {
            return NotFound(new { message = $"Assignment with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpGet("active/{membershipId}")]
    public async Task<IActionResult> GetActiveAssignment(string membershipId, CancellationToken token)
    {
        var result = await _service.GetActiveAssignmentAsync(membershipId, token);

        if (result == null)
        {
            return NotFound(new { message = $"Active assignment for {membershipId} not found." });
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAssignment([FromBody] CreateAdminAssignmentDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        { 
            return BadRequest(ModelState);
        }

        var result = await _service.CreateAsync(dto, token);
        return CreatedAtAction(nameof(GetAssignmentById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateAssignment(Guid id, [FromBody] UpdateAdminAssignmentDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _service.UpdateAsync(id, dto, token);

        if (result == null)
        {
            return NotFound(new { message = $"Assignment with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAssignment(Guid id, CancellationToken token)
    {
        if (!await _service.DeleteAsync(id, token)) 
        {
            return NotFound(new { message = $"Assignment with id {id} not found." });
        }
        return NoContent();
    }
}

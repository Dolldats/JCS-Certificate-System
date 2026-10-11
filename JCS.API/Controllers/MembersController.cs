using JCS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/members")]
[Authorize(Roles = "SuperAdmin")]
public sealed class MembersController : ControllerBase
{
    private readonly IJamaatMemberService _members;

    public MembersController(IJamaatMemberService members)
    {
        _members = members;
    }

    [HttpGet("tajneed/{membershipId}")]
    public async Task<IActionResult> GetRawTajneed(string membershipId, CancellationToken token)
    {
        var raw = await _members.GetRawMemberJsonAsync(membershipId, token);
        return Content(raw, "text/plain");
    }
}

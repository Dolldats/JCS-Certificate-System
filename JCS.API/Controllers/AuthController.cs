using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using JCS.Application.DTOs.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using JCS.Application.Interfaces.Services;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IJamaatAuthService _authService;
    private readonly IConfiguration _configuration;
    private readonly IAdminAssignmentService _assignmentService;

    public AuthController(IJamaatAuthService authService, IConfiguration configuration, IAdminAssignmentService assignmentService)
    {
        _authService = authService;
        _configuration = configuration;
        _assignmentService = assignmentService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto request, CancellationToken token)
    {
        if (!ModelState.IsValid || !await _authService.AuthenticateAsync(request.Username, request.Password, token))
        {
            return Unauthorized(new { message = "Invalid credentials." });
        }

        var assignment = await _assignmentService.GetActiveAssignmentAsync(request.Username, token);
        var role = assignment?.Role.ToString() ?? "Member";
        var auxiliary = assignment?.Auxiliary.ToString();
        var expires = DateTime.UtcNow.AddHours(8);
        var claims = new List<Claim> { new(ClaimTypes.Name, request.Username), new(ClaimTypes.Role, role) };
        claims.Add(new Claim("Auxiliary", auxiliary ?? "None"));
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var tokenValue = new JwtSecurityToken(claims: claims, expires: expires, signingCredentials: credentials);
        return Ok(new LoginResponseDto { AccessToken = new JwtSecurityTokenHandler().WriteToken(tokenValue), ExpiresAt = expires, Role = role, Auxiliary = auxiliary });
    }
}

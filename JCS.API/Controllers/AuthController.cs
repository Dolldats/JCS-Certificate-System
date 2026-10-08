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
    private readonly IJamaatMemberService _memberService;
    private readonly IParticipantService _participantService;
    private readonly IEventService _eventService;
    private readonly ICertificateService _certificateService;

    public AuthController(IJamaatAuthService authService, IConfiguration configuration, IAdminAssignmentService assignmentService, IJamaatMemberService memberService, IParticipantService participantService, IEventService eventService, ICertificateService certificateService)
    {
        _authService = authService;
        _configuration = configuration;
        _assignmentService = assignmentService;
        _memberService = memberService;
        _participantService = participantService;
        _eventService = eventService;
        _certificateService = certificateService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto request, CancellationToken token)
    {
        if (!ModelState.IsValid || !await _authService.AuthenticateAsync(request.Username, request.Password, token))
        {
            return Unauthorized(new { message = "Incorrect password" });
        }

        var assignment = await _assignmentService.GetActiveAssignmentAsync(request.Username, token);
        var memberProfile = await _memberService.VerifyMemberAsync(request.Username, token, request.Username);
        
        var role = assignment?.Role.ToString() ?? "Member";
        var auxiliary = assignment?.Auxiliary.ToString() ?? memberProfile?.Auxiliary?.ToString();
        var name = memberProfile?.FullName ?? request.Username;
        
        var expiryInHours = _configuration.GetValue<int>("Jwt:ExpiryInHours", 8);
        var expires = DateTime.UtcNow.AddHours(expiryInHours);
        var claims = new List<Claim> { new(ClaimTypes.Name, request.Username), new(ClaimTypes.Role, role) };
        claims.Add(new Claim("Auxiliary", auxiliary ?? "None"));
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var tokenValue = new JwtSecurityToken(claims: claims, expires: expires, signingCredentials: credentials);
        
        object? userEventsAndCerts = null;
        if (role == "Member")
        {
            var allParticipants = await _participantService.GetAllAsync(token);
            var userParticipations = allParticipants.Where(p => string.Equals(p.MembershipId, request.Username, StringComparison.OrdinalIgnoreCase)).ToList();
            
            if (userParticipations.Any())
            {
                var allEvents = await _eventService.GetAllAsync(token);
                var allCertificates = await _certificateService.GetAllAsync(token);
                
                var eventDetails = new List<object>();
                foreach (var p in userParticipations)
                {
                    var ev = allEvents.FirstOrDefault(e => e.Id == p.EventId);
                    var cert = allCertificates.FirstOrDefault(c => c.ParticipantId == p.Id);
                    eventDetails.Add(new 
                    {
                        EventName = ev?.Name ?? "Unknown Event",
                        EventDate = ev?.EventDate,
                        Status = p.VerificationStatus.ToString(),
                        CertificateIssued = cert != null,
                        CertificateNumber = cert?.CertificateNumber,
                        CertificateStatus = cert?.Status.ToString(),
                        CertificateDownloadUrl = cert != null ? $"/api/certificates/{cert.Id}/download" : null
                    });
                }
                userEventsAndCerts = eventDetails;
            }
            else
            {
                userEventsAndCerts = "No Event";
            }
        }
        
        return Ok(new 
        { 
            Message = $"Welcome {name}",
            AccessToken = new JwtSecurityTokenHandler().WriteToken(tokenValue), 
            ExpiresAt = expires, 
            Role = role, 
            Auxiliary = auxiliary,
            Profile = memberProfile,
            Events = userEventsAndCerts
        });
    }
}

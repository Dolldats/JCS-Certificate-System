using JCS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public sealed class DashboardController : ControllerBase
{
    private readonly IEventService _events;
    private readonly IParticipantService _participants;
    private readonly ICertificateService _certificates;
    private readonly IAuditLogService _auditLogs;

    public DashboardController(IEventService events, IParticipantService participants, ICertificateService certificates, IAuditLogService auditLogs)
    {
        _events = events;
        _participants = participants;
        _certificates = certificates;
        _auditLogs = auditLogs;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary(CancellationToken token)
    {
        var events = (await _events.GetAllAsync(token)).ToList();
        var participants = (await _participants.GetAllAsync(token)).ToList();
        var certificates = (await _certificates.GetAllAsync(token)).ToList();
        var logs = (await _auditLogs.GetAllAsync(token)).Take(10).ToList();

        if (User.IsInRole("Member"))
        {
            var membershipId = User.Identity?.Name;
            participants = participants.Where(x => string.Equals(x.MembershipId, membershipId, StringComparison.OrdinalIgnoreCase)).ToList();
            var eventIds = participants.Select(x => x.EventId).ToHashSet();
            events = events.Where(x => eventIds.Contains(x.Id)).ToList();
            certificates = certificates.Where(x => string.Equals(x.ParticipantMembershipId, membershipId, StringComparison.OrdinalIgnoreCase)).ToList();
        }
        else if (User.IsInRole("GeneralAdmin") && Enum.TryParse< JCS.Domain.Enum.Auxiliary >(User.FindFirst("Auxiliary")?.Value, true, out var auxiliary))
        {
            events = events.Where(x => x.Auxiliary == auxiliary).ToList();
            participants = participants.Where(x => x.Auxiliary == auxiliary).ToList();
            var eventIds = events.Select(x => x.Id).ToHashSet();
            certificates = certificates.Where(x => eventIds.Contains(x.EventId)).ToList();
        }

        return Ok(new
        {
            totalEvents = events.Count,
            activeEvents = events.Count(x => string.Equals(x.Status, "Active", StringComparison.OrdinalIgnoreCase) || string.Equals(x.Status, "InProgress", StringComparison.OrdinalIgnoreCase)),
            totalParticipants = participants.Count,
            verifiedParticipants = participants.Count(x => x.IsVerified),
            certificatesIssued = certificates.Count(x => x.Status == JCS.Domain.Enum.CertificateStatus.Issued || x.Status == JCS.Domain.Enum.CertificateStatus.Generated),
            memberApiMatchRate = participants.Count == 0 ? 0 : Math.Round(participants.Count(x => x.IsVerified) * 100m / participants.Count, 2),
            recentEvents = events.OrderByDescending(x => x.CreatedAt).Take(5),
            recentAuditLogs = logs
        });
    }
}

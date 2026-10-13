using JCS.Application.DTOs.Certificate;
using JCS.Application.Common;
using JCS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;
using JCS.Application.Interfaces.Repositories;
using System.Text.Json;
using JCS.Application.DTOs.CertificateTemplate;
using Microsoft.AspNetCore.Authorization;
using JCS.API.Common;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CertificatesController : ControllerBase
{
    private readonly ICertificateService _certificateService;
    private readonly ICertificateRepository _certificateRepository;
    private readonly ICertificateRenderer _certificateRenderer;
    private readonly IWebHostEnvironment _environment;
    private readonly IParticipantService _participantService;

    public CertificatesController(ICertificateService certificateService, ICertificateRepository certificateRepository, ICertificateRenderer certificateRenderer, IWebHostEnvironment environment, IParticipantService participantService)
    {
        _certificateService = certificateService;
        _certificateRepository = certificateRepository;
        _certificateRenderer = certificateRenderer;
        _environment = environment;
        _participantService = participantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllCertificates([FromQuery] PageQuery query, CancellationToken token)
    {
        var certificates = await _certificateService.GetAllAsync(token);
        if (User.IsInRole("Member"))
        {
            var membershipId = User.GetMembershipId();
            certificates = certificates.Where(x => string.Equals(x.ParticipantMembershipId, membershipId, StringComparison.OrdinalIgnoreCase)).ToList();
        }
        else if (User.IsInRole("GeneralAdmin"))
        {
            var allowed = new List<CertificateDto>();
            foreach (var certificate in certificates)
            {
                var participant = await _participantService.GetByIdAsync(certificate.ParticipantId, token);
                if (participant != null && CanAccessParticipant(participant)) allowed.Add(certificate);
            }
            certificates = allowed;
        }
        if (query.EventId.HasValue) certificates = certificates.Where(x => x.EventId == query.EventId.Value).ToList();
        if (!string.IsNullOrWhiteSpace(query.Search)) certificates = certificates.Where(x => x.CertificateNumber.Contains(query.Search, StringComparison.OrdinalIgnoreCase) || (x.ParticipantName?.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ?? false)).ToList();
        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<JCS.Domain.Enum.CertificateStatus>(query.Status, true, out var certificateStatus)) certificates = certificates.Where(x => x.Status == certificateStatus).ToList();
        var total = certificates.Count;
        var items = certificates.OrderByDescending(x => x.GeneratedAt).Skip((query.SafePage - 1) * query.SafePageSize).Take(query.SafePageSize).ToList();
        return Ok(new PagedResult<CertificateDto>(items, query.SafePage, query.SafePageSize, total));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCertificateById(Guid id, CancellationToken token)
    {
        var result = await _certificateService.GetByIdAsync(id, token);
        if (result == null)
        {
            return NotFound(new { message = $"Certificate with id {id} not found." });
        }

        if (!await CanAccessCertificateAsync(result, token)) return Forbid();

        return Ok(result);
    }

    [HttpGet("verify/{certificateNumber}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByCertificateNumber(string certificateNumber, CancellationToken token)
    {
        var result = await _certificateService.GetByCertificateNumberAsync(certificateNumber, token);
        if (result == null)
        {
            return NotFound(new { message = $"Certificate with number {certificateNumber} not found." });
        }

        return Ok(new
        {
            authenticity = result.Status == JCS.Domain.Enum.CertificateStatus.Revoked ? "Revoked" : "Authentic",
            certificate = result
        });
    }

    [HttpGet("event/{eventId:guid}")]
    public async Task<IActionResult> GetCertificatesByEvent(Guid eventId, CancellationToken token)
    {
        var certificates = await _certificateService.GetByEventIdAsync(eventId, token);
        if (User.IsInRole("Member"))
            certificates = certificates.Where(x => string.Equals(x.ParticipantMembershipId, User.GetMembershipId(), StringComparison.OrdinalIgnoreCase)).ToList();
        else if (User.IsInRole("GeneralAdmin"))
        {
            var allowed = new List<CertificateDto>();
            foreach (var certificate in certificates)
            {
                var participant = await _participantService.GetByIdAsync(certificate.ParticipantId, token);
                if (participant != null && CanAccessParticipant(participant)) allowed.Add(certificate);
            }
            certificates = allowed;
        }
        return Ok(certificates);
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyCertificates(CancellationToken token)
    {
        var membershipId = User.GetMembershipId();
        if (string.IsNullOrWhiteSpace(membershipId)) return Unauthorized();
        var certificates = await _certificateRepository.GetAllAsync(token);
        return Ok(certificates.Where(x => string.Equals(x.Participant?.MembershipId, membershipId, StringComparison.OrdinalIgnoreCase)).Select(x => new
        {
            x.Id,
            x.CertificateNumber,
            x.Status,
            x.EventId,
            EventName = x.Event?.Name,
            x.GeneratedAt,
            x.IssuedAt,
            x.FilePath
        }));
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,GeneralAdmin")]
    public async Task<IActionResult> CreateCertificate([FromBody] CreateCertificateDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (User.IsInRole("GeneralAdmin"))
        {
            var participant = await _participantService.GetByIdAsync(dto.ParticipantId, token);
            var userAux = User.FindFirst("Auxiliary")?.Value;
            if (participant != null && userAux != "None" && !CanAccessParticipant(participant))
            {
                return StatusCode(403, new { message = "General Admins can only create certificates for participants in their own auxiliary body." });
            }
        }

        var result = await _certificateService.CreateAsync(dto, token);
        return CreatedAtAction(nameof(GetCertificateById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,GeneralAdmin")]
    public async Task<IActionResult> UpdateCertificate(Guid id, [FromBody] UpdateCertificateDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var existing = await _certificateService.GetByIdAsync(id, token);
        if (existing == null) return NotFound(new { message = $"Certificate with id {id} not found." });
        if (!await CanAccessCertificateAsync(existing, token)) return Forbid();

        CertificateDto? result;
        try
        {
            result = await _certificateService.UpdateAsync(id, dto, token);
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
        if (result == null)
        {
            return NotFound(new { message = $"Certificate with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,GeneralAdmin")]
    public async Task<IActionResult> DeleteCertificate(Guid id, CancellationToken token)
    {
        var existing = await _certificateService.GetByIdAsync(id, token);
        if (existing == null) return NotFound(new { message = $"Certificate with id {id} not found." });
        if (!await CanAccessCertificateAsync(existing, token)) return Forbid();
        var deleted = await _certificateService.DeleteAsync(id, token);
        if (!deleted)
        {
            return NotFound(new { message = $"Certificate with id {id} not found." });
        }

        return NoContent();
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> DownloadCertificate(Guid id, CancellationToken token)
    {
        var certificate = await _certificateService.GetByIdAsync(id, token);
        if (certificate == null)
        {
            return NotFound(new { message = $"Certificate with id {id} not found." });
        }

        if (!await CanAccessCertificateAsync(certificate, token)) return Forbid();

        if (string.IsNullOrWhiteSpace(certificate.FilePath) || !System.IO.File.Exists(certificate.FilePath))
        {
            var entity = await _certificateRepository.GetByIdAsync(id, token);
            if (entity?.Participant == null || entity.Event == null || entity.CertificateTemplate == null)
            {
                return NotFound(new { message = "Certificate, participant, event, or template was not found." });
            }

            var layout = string.IsNullOrWhiteSpace(entity.CertificateTemplate.ConfigurationJson)
                ? new TemplateLayoutDto()
                : JsonSerializer.Deserialize<TemplateLayoutDto>(entity.CertificateTemplate.ConfigurationJson) ?? new TemplateLayoutDto();
            ResolveLayoutAssets(layout);
            var values = new Dictionary<string, string?>
            {
                ["ParticipantName"] = entity.Participant.FullName,
                ["EventName"] = entity.Event.Name,
                ["EventDate"] = entity.Event.EventDate.ToString("yyyy-MM-dd"),
                ["Venue"] = entity.Event.Venue,
                ["CertificateNumber"] = entity.CertificateNumber,
                ["Jamaat"] = entity.Participant.Jamaat,
                ["Dila"] = entity.Participant.Dila,
                ["Ilaqa"] = entity.Participant.Ilaqa,
                ["Auxiliary"] = entity.Participant.Auxiliary.ToString(),
                ["IssueDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd")
            };
            var bytes = _certificateRenderer.RenderPdf(layout, values,
                entity.CertificateTemplate.Width > 0 ? entity.CertificateTemplate.Width : 1122,
                entity.CertificateTemplate.Height > 0 ? entity.CertificateTemplate.Height : 793,
                ResolveAssetPath(entity.CertificateTemplate.BackgroundImagePath));
            var directory = Path.Combine(_environment.ContentRootPath, "uploads", "certificates");
            Directory.CreateDirectory(directory);
            entity.FilePath = Path.Combine(directory, $"{entity.CertificateNumber}.pdf");
            await System.IO.File.WriteAllBytesAsync(entity.FilePath, bytes, token);
            entity.Status = JCS.Domain.Enum.CertificateStatus.Generated;
            entity.GeneratedAt = DateTime.UtcNow;
            await _certificateRepository.UpdateAsync(entity, token);
            certificate.FilePath = entity.FilePath;
        }

        var contentType = Path.GetExtension(certificate.FilePath).ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            _ => "application/octet-stream"
        };

        return PhysicalFile(certificate.FilePath, contentType, $"{certificate.CertificateNumber}{Path.GetExtension(certificate.FilePath)}");
    }

    [HttpPost("{id:guid}/generate")]
    [Authorize(Roles = "SuperAdmin,GeneralAdmin")]
    public async Task<IActionResult> GenerateCertificate(Guid id, CancellationToken token)
    {
        var certificate = await _certificateRepository.GetByIdAsync(id, token);
        if (certificate?.Participant == null || certificate.Event == null || certificate.CertificateTemplate == null)
        {
            return NotFound(new { message = "Certificate, participant, event, or template was not found." });
        }
        if (!CanAccessParticipant(certificate.Participant)) return Forbid();

        var layout = string.IsNullOrWhiteSpace(certificate.CertificateTemplate.ConfigurationJson)
            ? new TemplateLayoutDto()
            : JsonSerializer.Deserialize<TemplateLayoutDto>(certificate.CertificateTemplate.ConfigurationJson) ?? new TemplateLayoutDto();
        ResolveLayoutAssets(layout);
        var values = new Dictionary<string, string?>
        {
            ["ParticipantName"] = certificate.Participant.FullName,
            ["EventName"] = certificate.Event.Name,
            ["EventDate"] = certificate.Event.EventDate.ToString("yyyy-MM-dd"),
            ["Venue"] = certificate.Event.Venue,
            ["CertificateNumber"] = certificate.CertificateNumber,
            ["Jamaat"] = certificate.Participant.Jamaat,
            ["Dila"] = certificate.Participant.Dila,
            ["Ilaqa"] = certificate.Participant.Ilaqa,
            ["Auxiliary"] = certificate.Participant.Auxiliary.ToString(),
            ["IssueDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd")
        };

        var bytes = _certificateRenderer.RenderPdf(layout,
            values,
            certificate.CertificateTemplate.Width > 0 ? certificate.CertificateTemplate.Width : 1122, 
            certificate.CertificateTemplate.Height > 0 ? certificate.CertificateTemplate.Height : 793,
            ResolveAssetPath(certificate.CertificateTemplate.BackgroundImagePath));

        var directory = Path.Combine(_environment.ContentRootPath, "uploads", "certificates");
        Directory.CreateDirectory(directory);

        var path = Path.Combine(directory, $"{certificate.CertificateNumber}.pdf");

        await System.IO.File.WriteAllBytesAsync(path, bytes, token);
        certificate.FilePath = path;
        certificate.Status = JCS.Domain.Enum.CertificateStatus.Generated;
        certificate.GeneratedAt = DateTime.UtcNow;

        await _certificateRepository.UpdateAsync(certificate, token);

        return File(bytes, "application/pdf", $"{certificate.CertificateNumber}.pdf");
    }

    [HttpPost("event/{eventId:guid}/generate-all")]
    [Authorize(Roles = "SuperAdmin,GeneralAdmin")]
    public async Task<IActionResult> GenerateEventCertificates(Guid eventId, CancellationToken token)
    {
        var certificates = await _certificateRepository.GetByEventIdAsync(eventId, token);
        if (User.IsInRole("GeneralAdmin"))
            certificates = certificates.Where(x => x.Participant != null && CanAccessParticipant(x.Participant)).ToList();
        var generated = 0;
        foreach (var certificate in certificates)
        {
            if (certificate.Participant == null || certificate.Event == null || certificate.CertificateTemplate == null)
            {
                continue;
            }

            var layout = string.IsNullOrWhiteSpace(certificate.CertificateTemplate.ConfigurationJson)
                ? new TemplateLayoutDto()
                : JsonSerializer.Deserialize<TemplateLayoutDto>(certificate.CertificateTemplate.ConfigurationJson) ?? new TemplateLayoutDto();
            ResolveLayoutAssets(layout);
            var values = new Dictionary<string, string?>
            {
                ["ParticipantName"] = certificate.Participant.FullName,
                ["EventName"] = certificate.Event.Name,
                ["EventDate"] = certificate.Event.EventDate.ToString("yyyy-MM-dd"),
                ["Venue"] = certificate.Event.Venue,
                ["CertificateNumber"] = certificate.CertificateNumber,
                ["Jamaat"] = certificate.Participant.Jamaat,
                ["Dila"] = certificate.Participant.Dila,
                ["Ilaqa"] = certificate.Participant.Ilaqa,
                ["Auxiliary"] = certificate.Participant.Auxiliary.ToString(),
                ["IssueDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd")
            };
            var bytes = _certificateRenderer.RenderPdf(layout,
                values,
                certificate.CertificateTemplate.Width > 0 ? certificate.CertificateTemplate.Width : 1122,
                certificate.CertificateTemplate.Height > 0 ? certificate.CertificateTemplate.Height : 793,
                ResolveAssetPath(certificate.CertificateTemplate.BackgroundImagePath));

            var directory = Path.Combine(_environment.ContentRootPath, "uploads", "certificates");
            Directory.CreateDirectory(directory);
            certificate.FilePath = Path.Combine(directory, $"{certificate.CertificateNumber}.pdf");

            await System.IO.File.WriteAllBytesAsync(certificate.FilePath, bytes, token);
            certificate.Status = JCS.Domain.Enum.CertificateStatus.Generated;
            certificate.GeneratedAt = DateTime.UtcNow;

            await _certificateRepository.UpdateAsync(certificate, token);
            generated++;
        }

        return Ok(new { eventId, generated, total = certificates.Count });
    }

    [HttpGet("event/{eventId:guid}/download-all-pdf")]
    public async Task<IActionResult> DownloadAllPdf(Guid eventId, CancellationToken token)
    {
        var certificates = await _certificateRepository.GetByEventIdAsync(eventId, token);
        if (User.IsInRole("Member"))
            certificates = certificates.Where(x => string.Equals(x.Participant?.MembershipId, User.GetMembershipId(), StringComparison.OrdinalIgnoreCase)).ToList();
        else if (User.IsInRole("GeneralAdmin"))
            certificates = certificates.Where(x => x.Participant != null && CanAccessParticipant(x.Participant)).ToList();

        var requests = new List<CertificateRenderRequest>();
        foreach (var certificate in certificates)
        {
            if (certificate.Participant == null || certificate.Event == null || certificate.CertificateTemplate == null)
            {
                continue;
            }

            var layout = string.IsNullOrWhiteSpace(certificate.CertificateTemplate.ConfigurationJson) ? new TemplateLayoutDto() : JsonSerializer.Deserialize<TemplateLayoutDto>(certificate.CertificateTemplate.ConfigurationJson) ?? new TemplateLayoutDto();
            ResolveLayoutAssets(layout);
            requests.Add(new CertificateRenderRequest(layout, new Dictionary<string, string?>
            {
                ["ParticipantName"] = certificate.Participant.FullName,
                ["EventName"] = certificate.Event.Name,
                ["EventDate"] = certificate.Event.EventDate.ToString("yyyy-MM-dd"),
                ["Venue"] = certificate.Event.Venue,
                ["CertificateNumber"] = certificate.CertificateNumber,
                ["Jamaat"] = certificate.Participant.Jamaat,
                ["Dila"] = certificate.Participant.Dila,
                ["Ilaqa"] = certificate.Participant.Ilaqa,
                ["Auxiliary"] = certificate.Participant.Auxiliary.ToString(),
                ["IssueDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd")
            }, 
            certificate.CertificateTemplate.Width > 0 ? certificate.CertificateTemplate.Width : 1122, 
            certificate.CertificateTemplate.Height > 0 ? certificate.CertificateTemplate.Height : 793,
            ResolveAssetPath(certificate.CertificateTemplate.BackgroundImagePath)));
        }

        if (requests.Count == 0)
        {
            return NotFound(new { message = "No printable certificates were found for this event." });
        }

        var bytes = _certificateRenderer.RenderPdfBatch(requests);
        return File(bytes, "application/pdf", $"event-{eventId}-certificates.pdf");
    }

    private string? ResolveAssetPath(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return null;
        }

        return Path.IsPathRooted(path) ? path : Path.Combine(_environment.ContentRootPath, path.Replace('/', Path.DirectorySeparatorChar));
    }

    private void ResolveLayoutAssets(TemplateLayoutDto layout)
    {
        foreach (var image in layout.ImageElements)
        {
            image.AssetKey = ResolveAssetPath(image.AssetKey) ?? image.AssetKey;
        }
    }

    private async Task<bool> CanAccessCertificateAsync(CertificateDto certificate, CancellationToken token)
    {
        if (User.IsInRole("Member"))
            return string.Equals(certificate.ParticipantMembershipId, User.GetMembershipId(), StringComparison.OrdinalIgnoreCase);

        if (User.IsInRole("GeneralAdmin"))
        {
            var participant = await _participantService.GetByIdAsync(certificate.ParticipantId, token);
            return participant != null && CanAccessParticipant(participant);
        }

        return User.IsInRole("SuperAdmin");
    }

    private bool CanAccessAuxiliary(JCS.Domain.Enum.Auxiliary auxiliary) =>
        !User.IsInRole("GeneralAdmin") ||
        (Enum.TryParse(User.FindFirst("Auxiliary")?.Value, true, out JCS.Domain.Enum.Auxiliary userAuxiliary) && userAuxiliary == auxiliary);

    private bool CanAccessParticipant(JCS.Application.DTOs.Participant.ParticipantDto participant)
    {
        return CanAccessParticipant(participant.Auxiliary, participant.Ilaqa);
    }

    private bool CanAccessParticipant(JCS.Domain.Entities.Participant participant)
    {
        return CanAccessParticipant(participant.Auxiliary, participant.Ilaqa);
    }

    private bool CanAccessParticipant(JCS.Domain.Enum.Auxiliary auxiliary, string? participantIlaqa)
    {
        if (!User.IsInRole("GeneralAdmin")) return true;
        if (!CanAccessAuxiliary(auxiliary)) return false;
        var userIlaqa = User.FindFirst("Ilaqa")?.Value;
        return string.IsNullOrWhiteSpace(userIlaqa)
            || string.IsNullOrWhiteSpace(participantIlaqa)
            || string.Equals(userIlaqa, participantIlaqa, StringComparison.OrdinalIgnoreCase);
    }
}

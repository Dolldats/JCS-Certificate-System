using JCS.Application.DTOs.Participant;
using JCS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using JCS.Domain.Enum;
using ClosedXML.Excel;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ParticipantsController : ControllerBase
{
    private readonly IParticipantService _participantService;
    private readonly IJamaatMemberService _jamaatMemberService;
    private readonly IEventService _eventService;

    public ParticipantsController(IParticipantService participantService, IJamaatMemberService jamaatMemberService, IEventService eventService)
    {
        _participantService = participantService;
        _jamaatMemberService = jamaatMemberService;
        _eventService = eventService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllParticipants(CancellationToken token)
    {
        var participants = await _participantService.GetAllAsync(token);
        if (User.IsInRole("Member"))
        {
            var membershipId = User.Identity?.Name;
            participants = participants.Where(x => string.Equals(x.MembershipId, membershipId, StringComparison.OrdinalIgnoreCase)).ToList();
        }
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

    [HttpGet("my")]
    public async Task<IActionResult> GetMyParticipations(CancellationToken token)
    {
        var membershipId = User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(membershipId)) return Unauthorized();
        var participants = await _participantService.GetAllAsync(token);
        return Ok(participants.Where(x => string.Equals(x.MembershipId, membershipId, StringComparison.OrdinalIgnoreCase)));
    }

    [HttpGet("verify/{membershipId}")]
    public async Task<IActionResult> VerifyMember(string membershipId, CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(membershipId))
        {
            return BadRequest(new { message = "Membership ID is required." });
        }

        var result = await _jamaatMemberService.VerifyMemberAsync(membershipId.Trim(), token);
        return Ok(result);
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

    [HttpPost("event/{eventId:guid}/upload-csv")]
    public async Task<IActionResult> UploadCsv(Guid eventId, IFormFile file, CancellationToken token)
    {
        if (eventId == Guid.Empty || file == null || file.Length == 0)
        {
            return BadRequest(new { message = "A valid eventId and non-empty CSV file are required." });
        }

        var targetEvent = await _eventService.GetByIdAsync(eventId, token);
        if (targetEvent == null)
        {
            return NotFound(new { message = $"Event with id {eventId} was not found." });
        }

        var result = new BulkParticipantImportResultDto();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        await using var stream = file.OpenReadStream();
        using var reader = new StreamReader(stream);
        var header = await reader.ReadLineAsync(token);
        if (header == null)
        {
            return BadRequest(new { message = "The CSV file is empty." });
        }

        var columns = header.Split(',').Select(x => x.Trim().ToLowerInvariant()).ToList();
        var membershipIndex = FindHeaderIndex(columns, "membershipid", "membershipnumber", "membershipno", "memberid", "memberno", "chandano", "chandanumber");
        var nameIndex = FindHeaderIndex(columns, "fullname", "name", "membername", "participantname");

        if (membershipIndex < 0)
        {
            return BadRequest(new { message = "CSV must contain a Membership ID or Membership Number column." });
        }

        string? line;
        while ((line = await reader.ReadLineAsync(token)) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            result.TotalRows++;
            var values = line.Split(',');
            var membershipId = membershipIndex < values.Length ? values[membershipIndex].Trim() : string.Empty;
            MemberVerificationResultDto verification;
            if (!seen.Add(membershipId))
            {
                verification = new MemberVerificationResultDto { MembershipId = membershipId, Status = VerificationStatus.Duplicate, Message = "Duplicate membership ID in the uploaded file." };
            }
            else
            {
                verification = await _jamaatMemberService.VerifyMemberAsync(membershipId, token);
            }

            if (verification.Status == VerificationStatus.Verified && verification.Auxiliary.HasValue && verification.Auxiliary.Value != targetEvent.Auxiliary)
            {
                verification.Status = VerificationStatus.Invalid;
                verification.Message = $"Member auxiliary ({verification.Auxiliary}) does not match the event auxiliary ({targetEvent.Auxiliary}).";
            }

            result.Results.Add(verification);
            result.StatusCounts[verification.Status] = result.StatusCounts.GetValueOrDefault(verification.Status) + 1;
            if (verification.Status == VerificationStatus.Verified)
            {
                var name = verification.FullName ?? (nameIndex >= 0 && nameIndex < values.Length ? values[nameIndex].Trim() : string.Empty);
                await _participantService.CreateAsync(new CreateParticipantDto
                {
                    EventId = eventId,
                    MembershipId = membershipId,
                    FullName = name,
                    Jamaat = verification.Jamaat,
                    Dila = verification.Dila,
                    Ilaqa = verification.Ilaqa,
                    Auxiliary = verification.Auxiliary ?? targetEvent.Auxiliary
                }, token);
                result.Imported++;
            }
        }

        return Ok(result);
    }

    [HttpPost("event/{eventId:guid}/upload-excel")]
    public async Task<IActionResult> UploadExcel(Guid eventId, IFormFile file, CancellationToken token)
    {
        if (eventId == Guid.Empty || file == null || file.Length == 0)
        {
            return BadRequest(new { message = "A valid eventId and non-empty Excel file are required." });
        }

        var targetEvent = await _eventService.GetByIdAsync(eventId, token);
        if (targetEvent == null)
        {
            return NotFound(new { message = $"Event with id {eventId} was not found." });
        }

        await using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);
        var sheet = workbook.Worksheets.FirstOrDefault();
        if (sheet == null || sheet.RangeUsed() == null)
        {
            return BadRequest(new { message = "The Excel file contains no data." });
        }

        var range = sheet.RangeUsed()!;
        var headers = range.FirstRow().Cells().Select(x => x.GetString().Trim().ToLowerInvariant()).ToList();
        var membershipIndex = FindHeaderIndex(headers, "membershipid", "membershipnumber", "membershipno", "memberid", "memberno", "chandano", "chandanumber");
        var nameIndex = FindHeaderIndex(headers, "fullname", "name", "membername", "participantname");

        if (membershipIndex < 0)
        {
            return BadRequest(new { message = "Excel must contain a Membership ID or Membership Number column." });
        }

        var result = new BulkParticipantImportResultDto();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var row in range.RowsUsed().Skip(1))
        {
            result.TotalRows++;
            var cells = row.Cells().ToList();
            var membershipId = membershipIndex < cells.Count ? cells[membershipIndex].GetString().Trim() : string.Empty;
            MemberVerificationResultDto verification;
            if (!seen.Add(membershipId))
            {
                verification = new MemberVerificationResultDto { MembershipId = membershipId, Status = VerificationStatus.Duplicate, Message = "Duplicate membership ID in the uploaded file." };
            }
            else
            {
                verification = await _jamaatMemberService.VerifyMemberAsync(membershipId, token);
            }

            if (verification.Status == VerificationStatus.Verified && verification.Auxiliary.HasValue && verification.Auxiliary.Value != targetEvent.Auxiliary)
            {
                verification.Status = VerificationStatus.Invalid;
                verification.Message = $"Member auxiliary ({verification.Auxiliary}) does not match the event auxiliary ({targetEvent.Auxiliary}).";
            }

            result.Results.Add(verification);
            result.StatusCounts[verification.Status] = result.StatusCounts.GetValueOrDefault(verification.Status) + 1;
            if (verification.Status == VerificationStatus.Verified)
            {
                var name = verification.FullName ?? (nameIndex >= 0 && nameIndex < cells.Count ? cells[nameIndex].GetString().Trim() : string.Empty);
                await _participantService.CreateAsync(new CreateParticipantDto
                {
                    EventId = eventId,
                    MembershipId = membershipId,
                    FullName = name,
                    Jamaat = verification.Jamaat,
                    Dila = verification.Dila,
                    Ilaqa = verification.Ilaqa,
                    Auxiliary = verification.Auxiliary ?? targetEvent.Auxiliary
                }, token);
                result.Imported++;
            }
        }

        return Ok(result);
    }

    private static int FindHeaderIndex(List<string> headers, params string[] aliases)
    {
        for (int i = 0; i < headers.Count; i++)
        {
            var headerClean = headers[i].Replace(" ", "").Replace("_", "").Replace("-", "");
            foreach (var alias in aliases)
            {
                var aliasClean = alias.Replace(" ", "").Replace("_", "").Replace("-", "");
                if (string.Equals(headerClean, aliasClean, StringComparison.OrdinalIgnoreCase))
                {
                    return i;
                }
            }
        }
        return -1;
    }
}

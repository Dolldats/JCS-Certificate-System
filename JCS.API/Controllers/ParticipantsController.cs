using JCS.Application.DTOs.Participant;
using JCS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using JCS.Domain.Enum;
using ClosedXML.Excel;
using JCS.Infastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using JCS.API.Common;

namespace JCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ParticipantsController : ControllerBase
{
    private const long MaxImportFileBytes = 10 * 1024 * 1024;
    private const int MaxImportRows = 10_000;
    private readonly IParticipantService _participantService;
    private readonly IJamaatMemberService _jamaatMemberService;
    private readonly IEventService _eventService;
    private readonly JcsDbContext _db;

    public ParticipantsController(IParticipantService participantService, IJamaatMemberService jamaatMemberService, IEventService eventService, JcsDbContext db)
    {
        _participantService = participantService;
        _jamaatMemberService = jamaatMemberService;
        _eventService = eventService;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllParticipants([FromQuery] PageQuery query, CancellationToken token)
    {
        var participants = await _participantService.GetAllAsync(token);
        if (User.IsInRole("Member"))
        {
            var membershipId = User.Identity?.Name;
            participants = participants.Where(x => string.Equals(x.MembershipId, membershipId, StringComparison.OrdinalIgnoreCase)).ToList();
        }
        else if (User.IsInRole("GeneralAdmin") && TryGetAuxiliary(out var auxiliary))
        {
            participants = participants.Where(x => x.Auxiliary == auxiliary).ToList();
        }
        if (query.EventId.HasValue) participants = participants.Where(x => x.EventId == query.EventId.Value).ToList();
        if (!string.IsNullOrWhiteSpace(query.Search)) participants = participants.Where(x => x.MembershipId.Contains(query.Search, StringComparison.OrdinalIgnoreCase) || x.FullName.Contains(query.Search, StringComparison.OrdinalIgnoreCase)).ToList();
        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<VerificationStatus>(query.Status, true, out var verificationStatus)) participants = participants.Where(x => x.VerificationStatus == verificationStatus).ToList();
        var total = participants.Count;
        var items = participants.OrderBy(x => x.FullName).Skip((query.SafePage - 1) * query.SafePageSize).Take(query.SafePageSize).ToList();
        return Ok(new PagedResult<ParticipantDto>(items, query.SafePage, query.SafePageSize, total));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetParticipantById(Guid id, CancellationToken token)
    {
        var result = await _participantService.GetByIdAsync(id, token);
        if (result == null)
        {
            return NotFound(new { message = $"Participant with id {id} not found." });
        }

        if (!CanAccessParticipant(result)) return Forbid();

        return Ok(result);
    }

    [HttpGet("event/{eventId:guid}")]
    public async Task<IActionResult> GetParticipantsByEvent(Guid eventId, CancellationToken token)
    {
        var participants = await _participantService.GetByEventIdAsync(eventId, token);
        if (User.IsInRole("Member"))
            participants = participants.Where(x => string.Equals(x.MembershipId, User.Identity?.Name, StringComparison.OrdinalIgnoreCase)).ToList();
        else if (User.IsInRole("GeneralAdmin") && TryGetAuxiliary(out var auxiliary))
            participants = participants.Where(x => x.Auxiliary == auxiliary).ToList();
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
    [Authorize(Roles = "SuperAdmin,GeneralAdmin")]
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
    [Authorize(Roles = "SuperAdmin,GeneralAdmin")]
    public async Task<IActionResult> CreateParticipant([FromBody] CreateParticipantDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var verification = await _jamaatMemberService.VerifyMemberAsync(dto.MembershipId, token);
        if (verification.Status == VerificationStatus.Verified)
        {
            dto.FullName = verification.FullName ?? dto.FullName;
            dto.Jamaat = verification.Jamaat;
            dto.Dila = verification.Dila;
            dto.Ilaqa = verification.Ilaqa;
            if (verification.Auxiliary.HasValue)
            {
                dto.Auxiliary = verification.Auxiliary.Value;
            }
        }

        var targetEvent = await _eventService.GetByIdAsync(dto.EventId, token);
        if (targetEvent == null)
        {
            return NotFound(new { message = $"Event with id {dto.EventId} was not found." });
        }

        if (User.IsInRole("GeneralAdmin"))
        {
            var userAux = User.FindFirst("Auxiliary")?.Value;
            if (userAux != "None" && !string.Equals(userAux, targetEvent.Auxiliary.ToString(), StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403, new { message = "General Admins can only add participants to events matching their own auxiliary body." });
            }
        }

        if (targetEvent.Auxiliary != dto.Auxiliary)
        {
             return BadRequest(new { message = "Participant's auxiliary body does not match the event's auxiliary body." });
        }

        var result = await _participantService.CreateAsync(dto, token);
        return CreatedAtAction(nameof(GetParticipantById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,GeneralAdmin")]
    public async Task<IActionResult> UpdateParticipant(Guid id, [FromBody] UpdateParticipantDto dto, CancellationToken token)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var existing = await _participantService.GetByIdAsync(id, token);
        if (existing == null) return NotFound(new { message = $"Participant with id {id} not found." });
        if (!CanAccessParticipant(existing) || (User.IsInRole("GeneralAdmin") && !CanAccessAuxiliary(dto.Auxiliary))) return Forbid();

        var result = await _participantService.UpdateAsync(id, dto, token);
        if (result == null)
        {
            return NotFound(new { message = $"Participant with id {id} not found." });
        }

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,GeneralAdmin")]
    public async Task<IActionResult> DeleteParticipant(Guid id, CancellationToken token)
    {
        var existing = await _participantService.GetByIdAsync(id, token);
        if (existing == null) return NotFound(new { message = $"Participant with id {id} not found." });
        if (!CanAccessParticipant(existing)) return Forbid();
        var deleted = await _participantService.DeleteAsync(id, token);
        if (!deleted)
        {
            return NotFound(new { message = $"Participant with id {id} not found." });
        }

        return NoContent();
    }

    [HttpPost("event/{eventId:guid}/upload-csv")]
    [Authorize(Roles = "SuperAdmin,GeneralAdmin")]
    public async Task<IActionResult> UploadCsv(Guid eventId, IFormFile file, CancellationToken token)
    {
        if (eventId == Guid.Empty || file == null || file.Length == 0 || file.Length > MaxImportFileBytes)
        {
            return BadRequest(new { message = "A valid eventId and non-empty CSV file are required." });
        }
        if (!string.Equals(Path.GetExtension(file.FileName), ".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Only .csv files are accepted." });

        var targetEvent = await _eventService.GetByIdAsync(eventId, token);
        if (targetEvent == null)
        {
            return NotFound(new { message = $"Event with id {eventId} was not found." });
        }
        
        if (User.IsInRole("GeneralAdmin"))
        {
            var userAux = User.FindFirst("Auxiliary")?.Value;
            if (userAux != "None" && !string.Equals(userAux, targetEvent.Auxiliary.ToString(), StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403, new { message = "General Admins can only upload participants to events matching their own auxiliary body." });
            }
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

        var columns = ParseCsvLine(header).Select(x => x.Trim().ToLowerInvariant()).ToList();
        var membershipIndex = FindHeaderIndex(columns, "membershipid", "membershipnumber", "membershipno", "memberid", "memberno", "chandano", "chandanumber");
        var nameIndex = FindHeaderIndex(columns, "fullname", "name", "membername", "participantname");

        if (membershipIndex < 0)
        {
            return BadRequest(new { message = "CSV must contain a Membership ID or Membership Number column." });
        }

        await using var transaction = await _db.Database.BeginTransactionAsync(token);
        string? line;
        while ((line = await reader.ReadLineAsync(token)) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            result.TotalRows++;
            if (result.TotalRows > MaxImportRows) return BadRequest(new { message = $"CSV cannot contain more than {MaxImportRows} data rows." });
            var values = ParseCsvLine(line);
            var membershipId = membershipIndex < values.Count ? values[membershipIndex].Trim() : string.Empty;
            if (string.IsNullOrWhiteSpace(membershipId)) continue;
            MemberVerificationResultDto verification;
            var alreadyImported = (await _participantService.GetByEventIdAsync(eventId, token))
                .Any(x => string.Equals(x.MembershipId, membershipId, StringComparison.OrdinalIgnoreCase));
            if (alreadyImported)
            {
                verification = new MemberVerificationResultDto { MembershipId = membershipId, Status = VerificationStatus.Duplicate, Message = "Membership ID is already registered for this event." };
            }
            else if (!seen.Add(membershipId))
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
                var name = verification.FullName ?? (nameIndex >= 0 && nameIndex < values.Count ? values[nameIndex].Trim() : string.Empty);
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

        await transaction.CommitAsync(token);
        return Ok(result);
    }

    [HttpPost("event/{eventId:guid}/upload-excel")]
    [Authorize(Roles = "SuperAdmin,GeneralAdmin")]
    public async Task<IActionResult> UploadExcel(Guid eventId, IFormFile file, CancellationToken token)
    {
        if (eventId == Guid.Empty || file == null || file.Length == 0 || file.Length > MaxImportFileBytes)
        {
            return BadRequest(new { message = "A valid eventId and non-empty Excel file are required." });
        }
        var extension = Path.GetExtension(file.FileName);
        if (!string.Equals(extension, ".xlsx", StringComparison.OrdinalIgnoreCase) && !string.Equals(extension, ".xlsm", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Only .xlsx or .xlsm files are accepted." });

        var targetEvent = await _eventService.GetByIdAsync(eventId, token);
        if (targetEvent == null)
        {
            return NotFound(new { message = $"Event with id {eventId} was not found." });
        }
        
        if (User.IsInRole("GeneralAdmin"))
        {
            var userAux = User.FindFirst("Auxiliary")?.Value;
            if (userAux != "None" && !string.Equals(userAux, targetEvent.Auxiliary.ToString(), StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403, new { message = "General Admins can only upload participants to events matching their own auxiliary body." });
            }
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
        await using var transaction = await _db.Database.BeginTransactionAsync(token);
        foreach (var row in range.RowsUsed().Skip(1))
        {
            result.TotalRows++;
            if (result.TotalRows > MaxImportRows) return BadRequest(new { message = $"Excel cannot contain more than {MaxImportRows} data rows." });
            var cells = row.Cells().ToList();
            var membershipId = membershipIndex < cells.Count ? cells[membershipIndex].GetString().Trim() : string.Empty;
            if (string.IsNullOrWhiteSpace(membershipId)) continue;
            MemberVerificationResultDto verification;
            var alreadyImported = (await _participantService.GetByEventIdAsync(eventId, token))
                .Any(x => string.Equals(x.MembershipId, membershipId, StringComparison.OrdinalIgnoreCase));
            if (alreadyImported)
            {
                verification = new MemberVerificationResultDto { MembershipId = membershipId, Status = VerificationStatus.Duplicate, Message = "Membership ID is already registered for this event." };
            }
            else if (!seen.Add(membershipId))
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

        await transaction.CommitAsync(token);
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

    private static List<string> ParseCsvLine(string line)
    {
        var values = new List<string>();
        var value = new System.Text.StringBuilder();
        var quoted = false;
        for (var i = 0; i < line.Length; i++)
        {
            var character = line[i];
            if (character == '"')
            {
                if (quoted && i + 1 < line.Length && line[i + 1] == '"') { value.Append('"'); i++; }
                else quoted = !quoted;
            }
            else if (character == ',' && !quoted) { values.Add(value.ToString()); value.Clear(); }
            else value.Append(character);
        }
        values.Add(value.ToString());
        return values;
    }

    private bool CanAccessParticipant(ParticipantDto participant) =>
        (!User.IsInRole("Member") || string.Equals(participant.MembershipId, User.Identity?.Name, StringComparison.OrdinalIgnoreCase)) &&
        (!User.IsInRole("GeneralAdmin") || (TryGetAuxiliary(out var auxiliary) && participant.Auxiliary == auxiliary));

    private bool CanAccessAuxiliary(Auxiliary auxiliary) =>
        !User.IsInRole("GeneralAdmin") || (TryGetAuxiliary(out var userAuxiliary) && userAuxiliary == auxiliary);

    private bool TryGetAuxiliary(out Auxiliary auxiliary) =>
        Enum.TryParse(User.FindFirst("Auxiliary")?.Value, true, out auxiliary);
}

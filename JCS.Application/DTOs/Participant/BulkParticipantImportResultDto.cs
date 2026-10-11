using JCS.Domain.Enum;

namespace JCS.Application.DTOs.Participant;

public class BulkParticipantImportResultDto
{
    public int TotalRows { get; set; }
    public int Imported { get; set; }
    public Dictionary<VerificationStatus, int> StatusCounts { get; set; } = new();
    public List<MemberVerificationResultDto> Results { get; set; } = new();
}

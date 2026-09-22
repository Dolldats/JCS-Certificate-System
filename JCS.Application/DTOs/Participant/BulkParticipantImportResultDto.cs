using JCS.Domain.Enum;

namespace JCS.Application.DTOs.Participant;

public class BulkParticipantImportResultDto
{
    public int TotalRows { get; set; }
    public int Imported { get; set; }
    public Dictionary<VerificationStatus, int> StatusCounts { get; set; } = new();
    public List<MemberVerificationResultDto> Results { get; set; } = new();
}

public class MemberVerificationResultDto
{
    public string MembershipId { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public VerificationStatus Status { get; set; }
    public string? Message { get; set; }
}

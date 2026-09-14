namespace JCS.Application.DTOs.Participant;

public sealed class CreateParticipantDto
{
    public string MembershipId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
}

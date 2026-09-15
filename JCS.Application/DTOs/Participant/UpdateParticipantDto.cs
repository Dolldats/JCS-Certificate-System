namespace JCS.Application.DTOs.Participant;

public sealed class UpdateParticipantDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public bool IsVerified { get; set; }
    public string VerificationStatus { get; set; } = string.Empty;
}

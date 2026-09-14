namespace JCS.Application.DTOs.Participant;

public record UpdateParticipantDto(string FullName, string? Email, bool IsVerified, string VerificationStatus);

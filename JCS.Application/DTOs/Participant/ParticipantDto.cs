namespace JCS.Application.DTOs.Participant;

public record ParticipantDto(Guid Id, string MembershipId, string FullName, string? Email, bool IsVerified, string VerificationStatus);

using JCS.Application.DTOs.Participant;

namespace JCS.Application.Interfaces.Services;

public interface IJamaatMemberService
{
    Task<MemberVerificationResultDto> VerifyMemberAsync(string membershipId, CancellationToken token = default, string? authenticatedUsername = null);

    Task<string> GetRawMemberJsonAsync(string membershipId, CancellationToken token = default, string? authenticatedUsername = null);
}

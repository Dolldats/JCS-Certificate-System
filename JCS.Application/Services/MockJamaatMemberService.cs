using JCS.Application.DTOs.Participant;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Enum;

namespace JCS.Application.Services;

public class MockJamaatMemberService : IJamaatMemberService
{
    public Task<MemberVerificationResultDto> VerifyMemberAsync(string membershipId, CancellationToken token = default)
    {
        var status = string.IsNullOrWhiteSpace(membershipId) ? VerificationStatus.Invalid : membershipId.EndsWith("404") ? VerificationStatus.NotFound : VerificationStatus.Verified;
        return Task.FromResult(new MemberVerificationResultDto { MembershipId = membershipId, FullName = status == VerificationStatus.Verified ? $"Mock Member {membershipId}" : null, Status = status, Message = $"Mock verification result: {status}." });
    }
}

using JCS.Application.DTOs.Participant;

namespace JCS.Application.Interfaces.Services;

public interface ITajneedProfileResolver
{
    Task<IReadOnlyDictionary<string, MemberVerificationResultDto>> GetProfilesAsync(
        IEnumerable<string?> membershipIds,
        CancellationToken token = default);
}

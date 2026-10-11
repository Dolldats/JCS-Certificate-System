using JCS.Application.DTOs.Participant;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Enum;
using Microsoft.Extensions.Caching.Memory;

namespace JCS.Application.Services;

public sealed class TajneedProfileResolver : ITajneedProfileResolver
{
    private static readonly TimeSpan CacheLifetime = TimeSpan.FromMinutes(5);

    private readonly IJamaatMemberService _memberService;
    private readonly IMemoryCache _cache;

    public TajneedProfileResolver(IJamaatMemberService memberService, IMemoryCache cache)
    {
        _memberService = memberService;
        _cache = cache;
    }

    public async Task<IReadOnlyDictionary<string, MemberVerificationResultDto>> GetProfilesAsync(
        IEnumerable<string?> membershipIds,
        CancellationToken token = default)
    {
        var distinctIds = membershipIds
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var result = new Dictionary<string, MemberVerificationResultDto>(StringComparer.OrdinalIgnoreCase);
        var missing = new List<string>();

        foreach (var id in distinctIds)
        {
            if (_cache.TryGetValue(CacheKey(id), out MemberVerificationResultDto? cached) && cached != null)
            {
                result[id] = cached;
            }
            else
            {
                missing.Add(id);
            }
        }

        if (missing.Count > 0)
        {
            var fetched = await Task.WhenAll(missing.Select(id => FetchAsync(id, token)));
            foreach (var profile in fetched)
            {
                result[profile.MembershipId] = profile;
            }
        }

        return result;
    }

    private async Task<MemberVerificationResultDto> FetchAsync(string membershipId, CancellationToken token)
    {
        try
        {
            var profile = await _memberService.VerifyMemberAsync(membershipId, token);
            profile.MembershipId = membershipId;
            if (profile.Status == VerificationStatus.Verified && string.IsNullOrWhiteSpace(profile.FullName))
            {
                profile.FullName = FallbackName(membershipId);
            }

            _cache.Set(CacheKey(membershipId), profile, CacheLifetime);
            return profile;
        }
        catch (Exception)
        {
            var fallback = new MemberVerificationResultDto
            {
                MembershipId = membershipId,
                FullName = FallbackName(membershipId),
                Status = VerificationStatus.VerificationFailed,
                Message = "Tajneed API is currently unavailable; showing stored membership ID."
            };
            _cache.Set(CacheKey(membershipId), fallback, TimeSpan.FromMinutes(1));
            return fallback;
        }
    }

    private static string CacheKey(string membershipId)
    {
        return $"tajneed:profile:{membershipId.ToUpperInvariant()}";
    }

    public static string FallbackName(string membershipId)
    {
        return $"Member {membershipId}";
    }
}

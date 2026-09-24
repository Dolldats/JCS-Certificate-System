using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using JCS.Application.Common;
using JCS.Application.DTOs.Participant;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Enum;
using Microsoft.AspNetCore.Http;

namespace JCS.Application.Services;

public sealed class JamaatApiMemberService : IJamaatMemberService
{
    private readonly HttpClient _client;
    private readonly JamaatApiOptions _options;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IJamaatTokenStore _tokenStore;

    public JamaatApiMemberService(HttpClient client, JamaatApiOptions options, IHttpContextAccessor httpContextAccessor, IJamaatTokenStore tokenStore)
    {
        _client = client;
        _options = options;
        _httpContextAccessor = httpContextAccessor;
        _tokenStore = tokenStore;
        _client.BaseAddress = new Uri(_options.BaseUrl);
    }

    public async Task<MemberVerificationResultDto> VerifyMemberAsync(string membershipId, CancellationToken token = default)
    {
        if (string.IsNullOrWhiteSpace(membershipId))
        {
            return new MemberVerificationResultDto { Status = VerificationStatus.Invalid, Message = "Membership ID is required." };
        }

        try
        {
            var username = _httpContextAccessor.HttpContext?.User.Identity?.Name;
            var accessToken = string.IsNullOrWhiteSpace(username) ? null : _tokenStore.Get(username);

            var requestUri = $"{_options.MemberPath.TrimEnd('/')}/{Uri.EscapeDataString(membershipId)}";
            using var request = new HttpRequestMessage(HttpMethod.Get, requestUri);

            if (!string.IsNullOrWhiteSpace(accessToken) && accessToken != "mock-dev-token")
            {
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            }

            var response = await _client.SendAsync(request, token);

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return new MemberVerificationResultDto
                {
                    MembershipId = membershipId,
                    Status = VerificationStatus.NotFound,
                    Message = "Member was not found in Tajneed database."
                };
            }

            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(token);
                return new MemberVerificationResultDto
                {
                    MembershipId = membershipId,
                    Status = VerificationStatus.VerificationFailed,
                    Message = $"Tajneed API returned status code {(int)response.StatusCode}: {errorText}"
                };
            }

            var rawJson = await response.Content.ReadAsStringAsync(token);
            using var memberDocument = JsonDocument.Parse(rawJson);
            var root = memberDocument.RootElement;
            var fullName = FindString(root, "fullName", "full_name", "name", "memberName", "member_name", "first_name");

            if (string.IsNullOrWhiteSpace(fullName))
            {
                var firstName = FindString(root, "firstName", "first_name", "fname");
                var lastName = FindString(root, "lastName", "last_name", "surname", "lname");
                if (!string.IsNullOrWhiteSpace(firstName) || !string.IsNullOrWhiteSpace(lastName))
                {
                    fullName = $"{firstName} {lastName}".Trim();
                }
            }

            var auxStr = FindString(root, "auxiliary", "auxiliaryBody", "auxiliary_body", "wing", "body");
            var jamaat = FindString(root, "jamaat", "jamaatName", "jamaat_name", "branch");
            var dila = FindString(root, "dila", "dilaName", "dila_name", "circuit", "state");
            var ilaqa = FindString(root, "ilaqa", "ilaqaName", "ilaqa_name", "zone", "region");

            return new MemberVerificationResultDto
            {
                MembershipId = membershipId,
                FullName = string.IsNullOrWhiteSpace(fullName) ? $"Member {membershipId}" : fullName,
                Auxiliary = ParseAuxiliary(auxStr),
                Jamaat = jamaat,
                Dila = dila,
                Ilaqa = ilaqa,
                Status = VerificationStatus.Verified,
                Message = "Member verified successfully via Tajneed API."
            };
        }
        catch (Exception exception)
        {
            return new MemberVerificationResultDto
            {
                MembershipId = membershipId,
                Status = VerificationStatus.VerificationFailed,
                Message = $"Tajneed API connection error: {exception.Message}"
            };
        }
    }

    private static Auxiliary? ParseAuxiliary(string? auxStr)
    {
        if (string.IsNullOrWhiteSpace(auxStr))
        {
            return null;
        }

        if (Enum.TryParse<Auxiliary>(auxStr.Trim(), true, out var parsed))
        {
            return parsed;
        }

        return null;
    }

    private static string? FindString(JsonElement element, params string[] names)
    {
        foreach (var name in names)
        {
            if (element.ValueKind == JsonValueKind.Object && element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String)
            {
                return value.GetString();
            }

            if (element.ValueKind == JsonValueKind.Object && element.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object && data.TryGetProperty(name, out value) && value.ValueKind == JsonValueKind.String)
            {
                return value.GetString();
            }
        }
        return null;
    }
}

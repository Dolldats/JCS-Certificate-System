using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
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

            if (string.IsNullOrWhiteSpace(accessToken))
            {
                return Result(membershipId, VerificationStatus.VerificationFailed, "No active Jama'at session was found. Please log in again.");
            }

            using var request = new HttpRequestMessage(HttpMethod.Get, $"{_options.MemberPath.TrimEnd('/')}/{Uri.EscapeDataString(membershipId)}");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            var response = await _client.SendAsync(request, token);
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return Result(membershipId, VerificationStatus.NotFound, "Member was not found.");
            }

            if (!response.IsSuccessStatusCode)
            {
                return Result(membershipId, VerificationStatus.VerificationFailed, $"Jama'at API returned {(int)response.StatusCode}.");
            }

            using var memberDocument = JsonDocument.Parse(await response.Content.ReadAsStringAsync(token));
            var root = memberDocument.RootElement;
            return new MemberVerificationResultDto
            {
                MembershipId = membershipId,
                FullName = FindString(root, "fullName", "name", "memberName"),
                Status = VerificationStatus.Verified,
                Message = "Member verified."
            };
        }
        catch (HttpRequestException exception)
        {
            return Result(membershipId, VerificationStatus.VerificationFailed, exception.Message);
        }
    }

    private static MemberVerificationResultDto Result(string id, VerificationStatus status, string message) => new() { MembershipId = id, Status = status, Message = message };

    private static string? FindString(JsonElement element, params string[] names)
    {
        foreach (var name in names)
        {
            if (element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String)
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

public sealed class JamaatApiOptions
{
    public string BaseUrl { get; set; } = "https://tajneedapi.ahmadiyyanigeria.net/";
    public string TokenPath { get; set; } = "token";
    public string MemberPath { get; set; } = "members";
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

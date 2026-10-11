using System.Net;
using System.Net.Http.Json;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using JCS.Application.Common;
using JCS.Application.DTOs.Participant;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Enum;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace JCS.Application.Services;

public sealed class JamaatApiMemberService : IJamaatMemberService
{
    private readonly HttpClient _client;
    private readonly JamaatApiOptions _options;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IJamaatTokenStore _tokenStore;
    private readonly ILogger<JamaatApiMemberService> _logger;

    public JamaatApiMemberService(HttpClient client, JamaatApiOptions options, IHttpContextAccessor httpContextAccessor, IJamaatTokenStore tokenStore, ILogger<JamaatApiMemberService> logger)
    {
        _client = client;
        _options = options;
        _httpContextAccessor = httpContextAccessor;
        _tokenStore = tokenStore;
        _logger = logger;
        _client.BaseAddress = new Uri(_options.BaseUrl);
    }

    public async Task<string> GetRawMemberJsonAsync(string membershipId, CancellationToken token = default, string? authenticatedUsername = null)
    {
        try
        {
            using var response = await SendMemberRequestAsync(membershipId, token, authenticatedUsername);
            var body = await response.Content.ReadAsStringAsync(token);
            return $"HTTP {(int)response.StatusCode}:\n{body}";
        }
        catch (Exception ex)
        {
            return $"REQUEST FAILED: {ex.Message}";
        }
    }

    private async Task<HttpResponseMessage> SendMemberRequestAsync(string membershipId, CancellationToken token, string? authenticatedUsername)
    {
        var username = authenticatedUsername ?? _httpContextAccessor.HttpContext?.User.GetMembershipId();
        var accessToken = string.IsNullOrWhiteSpace(username) ? null : _tokenStore.Get(username);

        var requestUri = $"{_options.MemberPath.TrimEnd('/')}/{Uri.EscapeDataString(membershipId)}";
        using var request = new HttpRequestMessage(HttpMethod.Get, requestUri);

        if (!string.IsNullOrWhiteSpace(accessToken) && accessToken != "mock-dev-token")
        {
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        }

        return await _client.SendAsync(request, token);
    }

    public async Task<MemberVerificationResultDto> VerifyMemberAsync(string membershipId, CancellationToken token = default, string? authenticatedUsername = null)
    {
        if (string.IsNullOrWhiteSpace(membershipId))
        {
            return new MemberVerificationResultDto { Status = VerificationStatus.Invalid, Message = "Membership ID is required." };
        }

        try
        {
            using var response = await SendMemberRequestAsync(membershipId, token, authenticatedUsername);

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
            var fullName = FindString(root, "fullName", "full_name", "memberName", "member_name");

            if (string.IsNullOrWhiteSpace(fullName))
            {
                var firstName = FindString(root, "firstName", "first_name", "fname", "firstname");
                var lastName = FindString(root, "lastName", "last_name", "surname", "lname", "lastname");
                if (!string.IsNullOrWhiteSpace(firstName) || !string.IsNullOrWhiteSpace(lastName))
                {
                    fullName = $"{firstName} {lastName}".Trim();
                }
            }

            var auxStr = FindString(root,
                "auxiliary", "auxiliaryBodyName", "auxiliaryBody", "auxiliary_body", "auxiliaryName", "auxiliary_name",
                "aux", "auxBody", "aux_body", "auxName", "aux_name",
                "tanzeem", "tanzeemName", "tanzeem_name",
                "organisation", "organization", "organizationName", "organization_name",
                "wing", "body", "section", "shoba", "group",
                "memberType", "member_type", "memberCategory", "member_category");
            var auxiliary = ParseAuxiliary(auxStr);

            var jamaat = FindString(root,
                "jamaat", "jamaatName", "jamaat_name",
                "jammat", "jammatName", "jammat_name",
                "branch", "branchName", "branch_name");
            var dila = FindString(root,
                "dila", "dilaName", "dila_name",
                "dilaa", "dilla",
                "circuit", "circuitName", "circuit_name",
                "state", "stateName", "state_name",
                "district", "districtName", "district_name",
                "division", "divisionName", "division_name");
            var ilaqa = FindString(root,
                "ilaqa", "ilaqaName", "ilaqa_name",
                "ilaqah", "ilaqaat",
                "zone", "zoneName", "zone_name",
                "region", "regionName", "region_name",
                "area", "areaName", "area_name",
                "territory", "territoryName", "territory_name");

            auxiliary ??= ScanForAuxiliary(root, fullName, jamaat, dila, ilaqa);

            if (auxiliary == null || dila == null || ilaqa == null)
            {
                _logger.LogDebug("Tajneed member {MembershipId} parsed with gaps (aux:{Aux} dila:{Dila} ilaqa:{Ilaqa}). Payload keys: {Keys}. Raw: {Raw}",
                    membershipId, auxStr, dila, ilaqa, string.Join(",", ListKeys(root)), rawJson);
            }

            return new MemberVerificationResultDto
            {
                MembershipId = membershipId,
                FullName = string.IsNullOrWhiteSpace(fullName) ? $"Member {membershipId}" : fullName,
                Auxiliary = auxiliary,
                Jamaat = jamaat,
                Dila = dila,
                Ilaqa = ilaqa,
                Status = VerificationStatus.Verified,
                Message = "Member verified successfully via Tajneed API."
            };
        }
        catch (OperationCanceledException) when (!token.IsCancellationRequested)
        {
            return new MemberVerificationResultDto
            {
                MembershipId = membershipId,
                Status = VerificationStatus.VerificationFailed,
                Message = "Tajneed API timed out. Please try again later."
            };
        }
        catch (HttpRequestException)
        {
            return new MemberVerificationResultDto
            {
                MembershipId = membershipId,
                Status = VerificationStatus.VerificationFailed,
                Message = "Tajneed API is currently unavailable. Please try again later."
            };
        }
        catch (JsonException)
        {
            return new MemberVerificationResultDto
            {
                MembershipId = membershipId,
                Status = VerificationStatus.VerificationFailed,
                Message = "Tajneed API returned an invalid response."
            };
        }
        catch (Exception)
        {
            return new MemberVerificationResultDto
            {
                MembershipId = membershipId,
                Status = VerificationStatus.VerificationFailed,
                Message = "Tajneed API verification failed. Please try again later."
            };
        }
    }

    private static Auxiliary? ParseAuxiliary(string? auxStr)
    {
        if (string.IsNullOrWhiteSpace(auxStr))
        {
            return null;
        }

        var value = auxStr.Trim();

        // Tajneed can return an auxiliary-related field containing a member ID
        // (for example, "51379"). That is not an auxiliary body.
        if (value.All(char.IsDigit))
        {
            return null;
        }

        if (Enum.TryParse<Auxiliary>(value, true, out var parsed))
        {
            return parsed;
        }

        var normalized = Normalize(auxStr);
        if (normalized.Contains("khuddam")) return Auxiliary.Khuddam;
        if (normalized.Contains("ansar")) return Auxiliary.Ansarullah;
        if (normalized.Contains("lajna")) return Auxiliary.Lajna;
        if (normalized.Contains("atfal") || normalized.Contains("tifl")) return Auxiliary.Atfal;
        if (normalized.Contains("nasir") || normalized.Contains("nasra")) return Auxiliary.Nasra;
        return null;
    }

    private static Auxiliary? ScanForAuxiliary(JsonElement root, params string?[] excludes)
    {
        foreach (var text in EnumerateStrings(root))
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                continue;
            }

            if (excludes.Any(x => !string.IsNullOrWhiteSpace(x)
                && string.Equals(text.Trim(), x!.Trim(), StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            var parsed = ParseAuxiliary(text);
            if (parsed.HasValue)
            {
                return parsed;
            }
        }

        return null;
    }

    private static IEnumerable<string> EnumerateStrings(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.String:
                yield return element.GetString() ?? string.Empty;
                break;
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    foreach (var text in EnumerateStrings(property.Value))
                    {
                        yield return text;
                    }
                }
                break;
            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray())
                {
                    foreach (var text in EnumerateStrings(item))
                    {
                        yield return text;
                    }
                }
                break;
        }
    }

    private static HashSet<string> ListKeys(JsonElement element, int maxDepth = 3)
    {
        var keys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        CollectKeys(element, keys, maxDepth);
        return keys;
    }

    private static void CollectKeys(JsonElement element, HashSet<string> keys, int depth)
    {
        if (depth < 0)
        {
            return;
        }

        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                keys.Add(property.Name);
                CollectKeys(property.Value, keys, depth - 1);
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                CollectKeys(item, keys, depth);
            }
        }
    }

    private static string Normalize(string value)
    {
        var builder = new StringBuilder(value.Length);
        foreach (var ch in value)
        {
            if (char.IsLetterOrDigit(ch))
            {
                builder.Append(char.ToLowerInvariant(ch));
            }
        }
        return builder.ToString();
    }

    private static string StripSuffix(string normalized)
    {
        foreach (var suffix in new[] { "name", "code", "number", "title", "label", "value", "text", "id", "no" })
        {
            if (normalized.Length > suffix.Length + 2 && normalized.EndsWith(suffix, StringComparison.Ordinal))
            {
                return normalized.Substring(0, normalized.Length - suffix.Length);
            }
        }

        return normalized;
    }

    private static string? FindString(JsonElement element, params string[] names)
    {
        foreach (var name in names)
        {
            var wanted = Normalize(name);
            foreach (var value in EnumerateMatches(element, wanted, tolerant: false))
            {
                var text = ExtractDisplayValue(value);
                if (!string.IsNullOrWhiteSpace(text)) return text;
            }
        }

        foreach (var name in names)
        {
            var wanted = Normalize(name);
            foreach (var value in EnumerateMatches(element, wanted, tolerant: true))
            {
                if (value.ValueKind == JsonValueKind.Number) continue;
                var text = ExtractDisplayValue(value);
                if (!string.IsNullOrWhiteSpace(text)) return text;
            }
        }

        return null;
    }

    private static IEnumerable<JsonElement> EnumerateMatches(JsonElement element, string wanted, bool tolerant)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                var normalized = Normalize(property.Name);
                if (normalized.Equals(wanted, StringComparison.Ordinal)
                    || (tolerant && StripSuffix(normalized).Equals(wanted, StringComparison.Ordinal)))
                {
                    yield return property.Value;
                }
            }

            foreach (var property in element.EnumerateObject())
            {
                if (property.Value.ValueKind is JsonValueKind.Object or JsonValueKind.Array)
                {
                    foreach (var nested in EnumerateMatches(property.Value, wanted, tolerant))
                    {
                        yield return nested;
                    }
                }
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                foreach (var nested in EnumerateMatches(item, wanted, tolerant))
                {
                    yield return nested;
                }
            }
        }
    }

    private static string? ExtractDisplayValue(JsonElement value)
    {
        if (value.ValueKind == JsonValueKind.String)
            return value.ToString();

        if (value.ValueKind == JsonValueKind.Object)
        {
            foreach (var name in new[] { "name", "fullName", "displayName", "label", "title", "value", "text", "description" })
            {
                foreach (var candidate in EnumerateMatches(value, Normalize(name), tolerant: false))
                {
                    var text = ExtractDisplayValue(candidate);
                    if (!string.IsNullOrWhiteSpace(text)) return text;
                }
            }

            return null;
        }

        if (value.ValueKind == JsonValueKind.Array)
        {
            var values = value.EnumerateArray()
                .Select(ExtractDisplayValue)
                .Where(x => !string.IsNullOrWhiteSpace(x));
            return string.Join(", ", values);
        }

        return null;
    }
}

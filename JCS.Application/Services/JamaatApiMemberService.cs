using System.Net;
using System.Net.Http.Json;
using System.Net.Http;
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

    public async Task<MemberVerificationResultDto> VerifyMemberAsync(string membershipId, CancellationToken token = default, string? authenticatedUsername = null)
    {
        if (string.IsNullOrWhiteSpace(membershipId))
        {
            return new MemberVerificationResultDto { Status = VerificationStatus.Invalid, Message = "Membership ID is required." };
        }

        try
        {
            var username = authenticatedUsername ?? _httpContextAccessor.HttpContext?.User.Identity?.Name;
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
            var dila = FindString(root, "dila", "dilaName", "dila_name", "circuit", "state", "district", "division");
            var ilaqa = FindString(root, "ilaqa", "ilaqaName", "ilaqa_name", "zone", "region", "area", "territory");

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

        if (Enum.TryParse<Auxiliary>(auxStr.Trim(), true, out var parsed))
        {
            return parsed;
        }

        var normalized = auxStr.Trim().Replace(" ", string.Empty).Replace("-", string.Empty).ToLowerInvariant();
        return normalized switch
        {
            "ansar" or "ansarullah" => Auxiliary.Ansarullah,
            "khuddam" or "khuddamulahmadiyya" => Auxiliary.Khuddam,
            "lajna" or "lajnaimaillah" => Auxiliary.Lajna,
            "atfal" or "atfalulahmadiyya" => Auxiliary.Atfal,
            "nasirat" or "nasra" => Auxiliary.Nasra,
            _ => null
        };
    }

    private static string? FindString(JsonElement element, params string[] names)
    {
        foreach (var name in names)
        {
            if (TryFindProperty(element, name, out var value))
            {
                var text = ExtractDisplayValue(value);
                if (!string.IsNullOrWhiteSpace(text)) return text;
            }
        }
        return null;
    }

    private static string? ExtractDisplayValue(JsonElement value)
    {
        if (value.ValueKind == JsonValueKind.String || value.ValueKind == JsonValueKind.Number)
            return value.ToString();

        if (value.ValueKind == JsonValueKind.Object)
        {
            foreach (var name in new[] { "name", "fullName", "displayName", "label", "title", "value", "text", "description" })
            {
                if (TryFindProperty(value, name, out var nested))
                {
                    var text = ExtractDisplayValue(nested);
                    if (!string.IsNullOrWhiteSpace(text)) return text;
                }
            }
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

    private static bool TryFindProperty(JsonElement element, string name, out JsonElement value)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase))
                {
                    value = property.Value;
                    return true;
                }
            }

            foreach (var property in element.EnumerateObject())
            {
                if (property.Value.ValueKind is JsonValueKind.Object or JsonValueKind.Array && TryFindProperty(property.Value, name, out value))
                {
                    return true;
                }
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                if (TryFindProperty(item, name, out value)) return true;
            }
        }

        value = default;
        return false;
    }
}

using System.Security.Claims;

namespace JCS.Application.Common;

public static class ClaimsPrincipalExtensions
{
    public static string? GetMembershipId(this ClaimsPrincipal? user)
    {
        if (user == null)
        {
            return null;
        }

        var id = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue(ClaimTypes.Name)
            ?? user.Identity?.Name;

        return string.IsNullOrWhiteSpace(id) ? null : id.Trim();
    }

    public static string? GetDisplayName(this ClaimsPrincipal? user)
    {
        if (user == null)
        {
            return null;
        }

        var display = user.FindFirstValue(ClaimTypes.Name);
        return string.IsNullOrWhiteSpace(display) ? null : display.Trim();
    }
}

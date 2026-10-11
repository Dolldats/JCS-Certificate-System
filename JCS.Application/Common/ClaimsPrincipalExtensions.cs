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

        var id = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(id))
        {
            id = user.FindFirstValue(ClaimTypes.Name);
        }

        if (string.IsNullOrWhiteSpace(id))
        {
            id = user.Identity?.Name;
        }

        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        return id.Trim();
    }

    public static string? GetDisplayName(this ClaimsPrincipal? user)
    {
        if (user == null)
        {
            return null;
        }

        var display = user.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(display))
        {
            return null;
        }

        return display.Trim();
    }
}

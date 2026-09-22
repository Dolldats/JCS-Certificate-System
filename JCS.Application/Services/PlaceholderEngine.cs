using System.Text.RegularExpressions;
using JCS.Application.Interfaces.Services;

namespace JCS.Application.Services;

public class PlaceholderEngine : IPlaceholderEngine
{
    private static readonly Regex TokenPattern = new("\\{\\{(?<key>[A-Za-z0-9_]+)\\}\\}", RegexOptions.Compiled);

    public string Replace(string template, IReadOnlyDictionary<string, string?> values)
    {
        return TokenPattern.Replace(template, match =>
        {
            var key = match.Groups["key"].Value;
            return values.TryGetValue(key, out var value) ? value ?? string.Empty : match.Value;
        });
    }
}

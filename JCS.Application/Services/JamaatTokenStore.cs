using System.Collections.Concurrent;
using JCS.Application.Interfaces.Services;

namespace JCS.Application.Services;

public class JamaatTokenStore : IJamaatTokenStore
{
    private readonly ConcurrentDictionary<string, (string Token, DateTime ExpiresAt)> _tokens = new(StringComparer.OrdinalIgnoreCase);

    public void Set(string username, string token, DateTime expiresAt) => _tokens[username] = (token, expiresAt);

    public string? Get(string username)
    {
        if (_tokens.TryGetValue(username, out var value) && value.ExpiresAt > DateTime.UtcNow)
        {
            return value.Token;
        }

        _tokens.TryRemove(username, out _);
        return null;
    }
}

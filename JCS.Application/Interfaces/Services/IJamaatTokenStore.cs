namespace JCS.Application.Interfaces.Services;

public interface IJamaatTokenStore
{
    void Set(string username, string token, DateTime expiresAt);
    string? Get(string username);
}

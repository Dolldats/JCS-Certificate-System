namespace JCS.Application.Interfaces.Services;

public interface IJamaatAuthService
{
    Task<bool> AuthenticateAsync(string username, string password, CancellationToken token = default);
}

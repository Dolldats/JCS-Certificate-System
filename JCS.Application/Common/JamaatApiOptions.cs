namespace JCS.Application.Common;

public sealed class JamaatApiOptions
{
    public string BaseUrl { get; set; } = "https://tajneedapi.ahmadiyyanigeria.net/";
    public string TokenPath { get; set; } = "token";
    public string MemberPath { get; set; } = "members";
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

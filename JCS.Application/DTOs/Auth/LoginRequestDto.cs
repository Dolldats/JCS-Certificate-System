using System.ComponentModel.DataAnnotations;

namespace JCS.Application.DTOs.Auth;

public class LoginRequestDto
{
    [Required] public string Username { get; set; } = string.Empty;
    [Required] public string Password { get; set; } = string.Empty;
}

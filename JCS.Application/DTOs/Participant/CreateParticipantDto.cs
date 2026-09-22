using JCS.Domain.Enum;
using System.ComponentModel.DataAnnotations;

namespace JCS.Application.DTOs.Participant;

public class CreateParticipantDto
{
    public Guid EventId { get; set; }

    [Required]
    [StringLength(100)]
    public string MembershipId { get; set; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [EmailAddress]
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Jamaat { get; set; }
    public string? Dila { get; set; }
    public string? Ilaqa { get; set; }
    public Auxiliary Auxiliary { get; set; }
}

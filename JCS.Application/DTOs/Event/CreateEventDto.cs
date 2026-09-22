using JCS.Domain.Enum;
using System.ComponentModel.DataAnnotations;

namespace JCS.Application.DTOs.Event;

public class CreateEventDto
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventType EventType { get; set; }
    public DateTime EventDate { get; set; }
    public DateTime? EndDate { get; set; }
    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string Venue { get; set; } = string.Empty;
    public Auxiliary Auxiliary { get; set; }
    public OrganizationalLevel OrganizationalLevel { get; set; }
    public string? OrganizationalUnit { get; set; }
}

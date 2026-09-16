using JCS.Domain.Enum;

namespace JCS.Application.DTOs.Event;

public class CreateEventDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventType EventType { get; set; }
    public DateTime EventDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Venue { get; set; } = string.Empty;
    public Auxiliary Auxiliary { get; set; }
    public OrganizationalLevel OrganizationalLevel { get; set; }
    public string? OrganizationalUnit { get; set; }
}

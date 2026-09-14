using JCS.Domain.Enum;

namespace JCS.Application.DTOs.Event;

public sealed class CreateEventDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string EventType { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public string Venue { get; set; } = string.Empty;
    public Auxiliary Auxiliary { get; set; }
    public string? OrganizationalUnit { get; set; }
}

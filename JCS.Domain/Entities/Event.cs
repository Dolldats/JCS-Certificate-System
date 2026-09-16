using JCS.Domain.Enum;

namespace JCS.Domain.Entities;

public class Event
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventType EventType { get; set; } = EventType.Other;
    public DateTime EventDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Venue { get; set; } = string.Empty;
    public Auxiliary Auxiliary { get; set; }
    public OrganizationalLevel OrganizationalLevel { get; set; } = OrganizationalLevel.Jamaat;
    public string? OrganizationalUnit { get; set; }
    public string Status { get; set; } = "Draft";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Participant> Participants { get; set; } = new List<Participant>();
    public ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();
}

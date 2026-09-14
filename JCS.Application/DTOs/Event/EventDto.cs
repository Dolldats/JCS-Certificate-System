using JCS.Domain.Enum;

namespace JCS.Application.DTOs.Event;

public record EventDto(Guid Id, string Name, string? Description, string EventType, DateTime EventDate, string Venue, Auxiliary Auxiliary, string? OrganizationalUnit, string Status);

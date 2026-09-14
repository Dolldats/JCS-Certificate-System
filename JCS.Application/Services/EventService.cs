using JCS.Application.DTOs.Event;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;

namespace JCS.Application.Services;

public sealed class EventService(IEventRepository repo) : IEventService
{
    public async Task<EventDto?> GetByIdAsync(Guid id, CancellationToken t = default) => Map(await repo.GetByIdAsync(id, t));
    public async Task<IReadOnlyCollection<EventDto>> GetAllAsync(CancellationToken t = default) => (await repo.GetAllAsync(t)).Select(x => Map(x)!).ToArray();
    public async Task<EventDto> CreateAsync(CreateEventDto d, CancellationToken t = default) { var e = new Event { Id = Guid.NewGuid(), Name=d.Name, Description=d.Description, EventType=d.EventType, EventDate=d.EventDate, Venue=d.Venue, Auxiliary=d.Auxiliary, OrganizationalUnit=d.OrganizationalUnit }; await repo.AddAsync(e,t); return Map(e)!; }
    public async Task<EventDto?> UpdateAsync(Guid id, UpdateEventDto d, CancellationToken t = default) { var e=await repo.GetByIdAsync(id,t); if(e is null)return null; e.Name=d.Name;e.Description=d.Description;e.EventType=d.EventType;e.EventDate=d.EventDate;e.Venue=d.Venue;e.Auxiliary=d.Auxiliary;e.OrganizationalUnit=d.OrganizationalUnit;e.Status=d.Status;await repo.UpdateAsync(e,t);return Map(e); }
    public async Task<bool> DeleteAsync(Guid id, CancellationToken t = default) { if(await repo.GetByIdAsync(id,t) is null)return false;await repo.DeleteAsync(id,t);return true; }
    private static EventDto? Map(Event? e) => e is null ? null : new(e.Id,e.Name,e.Description,e.EventType,e.EventDate,e.Venue,e.Auxiliary,e.OrganizationalUnit,e.Status);
}

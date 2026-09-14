using JCS.Application.DTOs.Event;

namespace JCS.Application.Interfaces.Services;

public interface IEventService
{
    Task<EventDto?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<EventDto>> GetAllAsync(CancellationToken token = default);
    Task<EventDto> CreateAsync(CreateEventDto dto, CancellationToken token = default);
    Task<EventDto?> UpdateAsync(Guid id, UpdateEventDto dto, CancellationToken token = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken token = default);
}

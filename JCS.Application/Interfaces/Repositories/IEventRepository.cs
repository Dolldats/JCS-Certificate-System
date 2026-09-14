using JCS.Domain.Entities;

namespace JCS.Application.Interfaces.Repositories;

public interface IEventRepository
{
    Task<Event?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<Event>> GetAllAsync(CancellationToken token = default);
    Task AddAsync(Event entity, CancellationToken token = default);
    Task UpdateAsync(Event entity, CancellationToken token = default);
    Task DeleteAsync(Guid id, CancellationToken token = default);
}

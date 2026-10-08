using JCS.Domain.Entities;

namespace JCS.Application.Interfaces.Repositories;

public interface IParticipantRepository
{
    Task<Participant?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<Participant>> GetAllAsync(CancellationToken token = default);
    Task<IReadOnlyCollection<Participant>> GetByEventIdAsync(Guid eventId, CancellationToken token = default);
    Task<Participant?> GetByEventAndMembershipIdAsync(Guid eventId, string membershipId, CancellationToken token = default);
    Task AddAsync(Participant entity, CancellationToken token = default);
    Task AddRangeAsync(IEnumerable<Participant> entities, CancellationToken token = default);
    Task UpdateAsync(Participant entity, CancellationToken token = default);
    Task DeleteAsync(Guid id, CancellationToken token = default);
}

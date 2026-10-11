using JCS.Domain.Entities;

namespace JCS.Application.Interfaces.Repositories;

public interface ICertificateRepository
{
    Task<Certificate?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<Certificate?> GetByCertificateNumberAsync(string certificateNumber, CancellationToken token = default);
    Task<IReadOnlyCollection<Certificate>> GetAllAsync(CancellationToken token = default);
    Task<IReadOnlyCollection<Certificate>> GetByEventIdAsync(Guid eventId, CancellationToken token = default);
    Task<IReadOnlyCollection<Certificate>> GetByParticipantIdAsync(Guid participantId, CancellationToken token = default);
    Task AddAsync(Certificate entity, CancellationToken token = default);
    Task AddRangeAsync(IEnumerable<Certificate> entities, CancellationToken token = default);
    Task UpdateAsync(Certificate entity, CancellationToken token = default);
    Task DeleteAsync(Guid id, CancellationToken token = default);
}

using JCS.Domain.Entities;

namespace JCS.Application.Interfaces.Repositories;

public interface ICertificateRepository
{
    Task<Certificate?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<Certificate>> GetAllAsync(CancellationToken token = default);
    Task AddAsync(Certificate entity, CancellationToken token = default);
    Task UpdateAsync(Certificate entity, CancellationToken token = default);
    Task DeleteAsync(Guid id, CancellationToken token = default);
}

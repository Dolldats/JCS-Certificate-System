using JCS.Domain.Entities;

namespace JCS.Application.Interfaces.Repositories;

public interface ICertificateTemplateRepository
{
    Task<CertificateTemplate?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<CertificateTemplate>> GetAllAsync(CancellationToken token = default);
    Task AddAsync(CertificateTemplate entity, CancellationToken token = default);
    Task UpdateAsync(CertificateTemplate entity, CancellationToken token = default);
    Task DeleteAsync(Guid id, CancellationToken token = default);
}

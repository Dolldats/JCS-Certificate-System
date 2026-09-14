using JCS.Domain.Entities;

namespace JCS.Application.Interfaces.Repositories;

public interface IAuditLogRepository
{
    Task<AuditLog?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<AuditLog>> GetAllAsync(CancellationToken token = default);
    Task AddAsync(AuditLog entity, CancellationToken token = default);
    Task UpdateAsync(AuditLog entity, CancellationToken token = default);
    Task DeleteAsync(Guid id, CancellationToken token = default);
}

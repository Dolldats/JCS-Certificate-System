using JCS.Domain.Entities;
using JCS.Domain.Enum;

namespace JCS.Application.Interfaces.Repositories;

public interface IAuditLogRepository
{
    Task<AuditLog?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<AuditLog>> GetAllAsync(CancellationToken token = default);
    Task<IReadOnlyCollection<AuditLog>> GetFilteredAsync(DateTime? from, DateTime? to, string? performedBy, string? action, Auxiliary? auxiliary, CancellationToken token = default);
    Task AddAsync(AuditLog entity, CancellationToken token = default);
}

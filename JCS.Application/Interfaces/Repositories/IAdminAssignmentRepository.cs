using JCS.Domain.Entities;

namespace JCS.Application.Interfaces.Repositories;

public interface IAdminAssignmentRepository
{
    Task<AdminAssignment?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<AdminAssignment>> GetAllAsync(CancellationToken token = default);
    Task<AdminAssignment?> GetActiveAssignmentAsync(string membershipId, CancellationToken token = default);
    Task AddAsync(AdminAssignment entity, CancellationToken token = default);
    Task UpdateAsync(AdminAssignment entity, CancellationToken token = default);
    Task DeleteAsync(Guid id, CancellationToken token = default);
}

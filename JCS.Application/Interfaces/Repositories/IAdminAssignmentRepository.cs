using JCS.Domain.Entities;

namespace JCS.Application.Interfaces.Repositories;

public interface IAdminAssignmentRepository
{
    Task<AdminAssignment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<AdminAssignment>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<AdminAssignment?> GetActiveAssignmentAsync(string membershipId, CancellationToken cancellationToken = default);
    Task AddAsync(AdminAssignment assignment, CancellationToken cancellationToken = default);
    Task UpdateAsync(AdminAssignment assignment, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

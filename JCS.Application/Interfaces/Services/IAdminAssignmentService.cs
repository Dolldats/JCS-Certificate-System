using JCS.Application.DTOs.AdminAssignment;

namespace JCS.Application.Interfaces.Services;

public interface IAdminAssignmentService
{
    Task<AdminAssignmentDto?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<AdminAssignmentDto>> GetAllAsync(CancellationToken token = default);
    Task<AdminAssignmentDto?> GetActiveAssignmentAsync(string membershipId, CancellationToken token = default);
    Task<AdminAssignmentDto> CreateAsync(CreateAdminAssignmentDto dto, CancellationToken token = default);
    Task<AdminAssignmentDto?> UpdateAsync(Guid id, UpdateAdminAssignmentDto dto, CancellationToken token = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken token = default);
}

using JCS.Application.DTOs.AdminAssignment;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;

namespace JCS.Application.Services;

public sealed class AdminAssignmentService(IAdminAssignmentRepository repo) : IAdminAssignmentService
{
    public async Task<AdminAssignmentDto?> GetByIdAsync(Guid id, CancellationToken token = default) => Map(await repo.GetByIdAsync(id, token));

    public async Task<IReadOnlyCollection<AdminAssignmentDto>> GetAllAsync(CancellationToken token = default) =>
        (await repo.GetAllAsync(token)).Select(x => Map(x)!).ToArray();

    public async Task<AdminAssignmentDto?> GetActiveAssignmentAsync(string membershipId, CancellationToken token = default) =>
        Map(await repo.GetActiveAssignmentAsync(membershipId, token));

    public async Task<AdminAssignmentDto> CreateAsync(CreateAdminAssignmentDto dto, CancellationToken token = default)
    {
        var assignment = new Domain.Entities.AdminAssignment
        {
            Id = Guid.NewGuid(),
            MembershipId = dto.MembershipId,
            Auxiliary = dto.Auxiliary,
            AssignedBy = dto.AssignedBy,
            AssignedAt = DateTime.UtcNow
        };

        await repo.AddAsync(assignment, token);
        return Map(assignment)!;
    }

    public async Task<AdminAssignmentDto?> UpdateAsync(Guid id, UpdateAdminAssignmentDto dto, CancellationToken token = default)
    {
        var assignment = await repo.GetByIdAsync(id, token);
        if (assignment is null) return null;

        assignment.Auxiliary = dto.Auxiliary;
        assignment.Status = dto.Status;
        assignment.RevokedBy = dto.RevokedBy;
        assignment.RevokedAt = dto.Status == Domain.Enum.AdminStatus.Active ? null : DateTime.UtcNow;

        await repo.UpdateAsync(assignment, token);
        return Map(assignment);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken token = default)
    {
        if (await repo.GetByIdAsync(id, token) is null) return false;
        await repo.DeleteAsync(id, token);
        return true;
    }

    private static AdminAssignmentDto? Map(Domain.Entities.AdminAssignment? assignment) => assignment is null ? null : new()
    {
        Id = assignment.Id,
        MembershipId = assignment.MembershipId,
        Auxiliary = assignment.Auxiliary,
        Status = assignment.Status,
        AssignedBy = assignment.AssignedBy,
        AssignedAt = assignment.AssignedAt,
        RevokedBy = assignment.RevokedBy,
        RevokedAt = assignment.RevokedAt
    };
}

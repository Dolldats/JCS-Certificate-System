using JCS.Application.DTOs.AdminAssignment;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;
using JCS.Domain.Enum;

namespace JCS.Application.Services;

public sealed class AdminAssignmentService : IAdminAssignmentService
{
    private readonly IAdminAssignmentRepository _adminAssignmentRepository;

    public AdminAssignmentService(IAdminAssignmentRepository adminAssignmentRepository)
    {
        _adminAssignmentRepository = adminAssignmentRepository;
    }

    public async Task<AdminAssignmentDto?> GetByIdAsync(Guid id, CancellationToken token = default)
    {
        var assignment = await _adminAssignmentRepository.GetByIdAsync(id, token);
        if (assignment == null)
        {
            return null;
        }

        return new AdminAssignmentDto
        {
            Id = assignment.Id,
            MembershipId = assignment.MembershipId,
            Auxiliary = assignment.Auxiliary,
            Role = assignment.Role,
            Status = assignment.Status,
            AssignedBy = assignment.AssignedBy,
            AssignedAt = assignment.AssignedAt,
            RevokedBy = assignment.RevokedBy,
            RevokedAt = assignment.RevokedAt
        };
    }

    public async Task<IReadOnlyCollection<AdminAssignmentDto>> GetAllAsync(CancellationToken token = default)
    {
        var assignments = await _adminAssignmentRepository.GetAllAsync(token);
        var resultList = new List<AdminAssignmentDto>();

        foreach (var assignment in assignments)
        {
            resultList.Add(new AdminAssignmentDto
            {
                Id = assignment.Id,
                MembershipId = assignment.MembershipId,
                Auxiliary = assignment.Auxiliary,
                Role = assignment.Role,
                Status = assignment.Status,
                AssignedBy = assignment.AssignedBy,
                AssignedAt = assignment.AssignedAt,
                RevokedBy = assignment.RevokedBy,
                RevokedAt = assignment.RevokedAt
            });
        }

        return resultList;
    }

    public async Task<AdminAssignmentDto?> GetActiveAssignmentAsync(string membershipId, CancellationToken token = default)
    {
        var assignment = await _adminAssignmentRepository.GetActiveAssignmentAsync(membershipId, token);
        if (assignment == null)
        {
            return null;
        }

        return new AdminAssignmentDto
        {
            Id = assignment.Id,
            MembershipId = assignment.MembershipId,
            Auxiliary = assignment.Auxiliary,
            Role = assignment.Role,
            Status = assignment.Status,
            AssignedBy = assignment.AssignedBy,
            AssignedAt = assignment.AssignedAt,
            RevokedBy = assignment.RevokedBy,
            RevokedAt = assignment.RevokedAt
        };
    }

    public async Task<AdminAssignmentDto> CreateAsync(CreateAdminAssignmentDto dto, CancellationToken token = default)
    {
        var assignment = new AdminAssignment
        {
            Id = Guid.NewGuid(),
            MembershipId = dto.MembershipId,
            Auxiliary = dto.Auxiliary,
            Role = dto.Role,
            Status = AdminStatus.Active,
            AssignedBy = dto.AssignedBy,
            AssignedAt = DateTime.UtcNow
        };

        await _adminAssignmentRepository.AddAsync(assignment, token);

        return new AdminAssignmentDto
        {
            Id = assignment.Id,
            MembershipId = assignment.MembershipId,
            Auxiliary = assignment.Auxiliary,
            Role = assignment.Role,
            Status = assignment.Status,
            AssignedBy = assignment.AssignedBy,
            AssignedAt = assignment.AssignedAt,
            RevokedBy = assignment.RevokedBy,
            RevokedAt = assignment.RevokedAt
        };
    }

    public async Task<AdminAssignmentDto?> UpdateAsync(Guid id, UpdateAdminAssignmentDto dto, CancellationToken token = default)
    {
        var assignment = await _adminAssignmentRepository.GetByIdAsync(id, token);
        if (assignment == null)
        {
            return null;
        }

        assignment.Auxiliary = dto.Auxiliary;
        assignment.Role = dto.Role;
        assignment.Status = dto.Status;
        assignment.RevokedBy = dto.RevokedBy;
        assignment.RevokedAt = dto.Status == AdminStatus.Active ? null : DateTime.UtcNow;

        await _adminAssignmentRepository.UpdateAsync(assignment, token);

        return new AdminAssignmentDto
        {
            Id = assignment.Id,
            MembershipId = assignment.MembershipId,
            Auxiliary = assignment.Auxiliary,
            Role = assignment.Role,
            Status = assignment.Status,
            AssignedBy = assignment.AssignedBy,
            AssignedAt = assignment.AssignedAt,
            RevokedBy = assignment.RevokedBy,
            RevokedAt = assignment.RevokedAt
        };
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken token = default)
    {
        var assignment = await _adminAssignmentRepository.GetByIdAsync(id, token);
        if (assignment == null)
        {
            return false;
        }

        await _adminAssignmentRepository.DeleteAsync(id, token);
        return true;
    }
}

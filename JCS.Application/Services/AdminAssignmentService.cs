using JCS.Application.Common;
using JCS.Application.DTOs.AdminAssignment;
using JCS.Application.DTOs.Participant;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;
using JCS.Domain.Enum;
using Microsoft.AspNetCore.Http;

namespace JCS.Application.Services;

public class AdminAssignmentService : IAdminAssignmentService
{
    private readonly IAdminAssignmentRepository _adminAssignmentRepository;
    private readonly IJamaatMemberService _memberService;
    private readonly ITajneedProfileResolver _profileResolver;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AdminAssignmentService(
        IAdminAssignmentRepository adminAssignmentRepository,
        IJamaatMemberService memberService,
        ITajneedProfileResolver profileResolver,
        IHttpContextAccessor httpContextAccessor)
    {
        _adminAssignmentRepository = adminAssignmentRepository;
        _memberService = memberService;
        _profileResolver = profileResolver;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<AdminAssignmentDto?> GetByIdAsync(Guid id, CancellationToken token = default)
    {
        var assignment = await _adminAssignmentRepository.GetByIdAsync(id, token);
        if (assignment == null)
        {
            return null;
        }

        var dtos = await EnrichAsync(new[] { assignment }, token);
        return dtos[0];
    }

    public async Task<IReadOnlyCollection<AdminAssignmentDto>> GetAllAsync(CancellationToken token = default)
    {
        var assignments = await _adminAssignmentRepository.GetAllAsync(token);
        return await EnrichAsync(assignments, token);
    }

    public async Task<AdminAssignmentDto?> GetActiveAssignmentAsync(string membershipId, CancellationToken token = default)
    {
        var assignment = await _adminAssignmentRepository.GetActiveAssignmentAsync(membershipId, token);
        if (assignment == null)
        {
            return null;
        }

        var dtos = await EnrichAsync(new[] { assignment }, token);
        return dtos[0];
    }

    public async Task<AdminAssignmentDto> CreateAsync(CreateAdminAssignmentDto dto, CancellationToken token = default)
    {
        if (!Enum.IsDefined(dto.Auxiliary))
        {
            throw new InvalidOperationException("A valid auxiliary is required for an admin assignment.");
        }

        if (!Enum.IsDefined(dto.Role))
        {
            throw new InvalidOperationException("A valid admin role is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.MembershipId))
        {
            throw new InvalidOperationException("Membership ID is required.");
        }

        var membershipId = dto.MembershipId.Trim();

        var assignedBy = CurrentMembershipId() ?? dto.AssignedBy?.Trim();
        if (string.IsNullOrWhiteSpace(assignedBy))
        {
            throw new InvalidOperationException("Unable to determine the assigning user. Please log in again.");
        }

        var assignerAssignment = await _adminAssignmentRepository.GetActiveAssignmentAsync(assignedBy, token);
        if (assignerAssignment == null || assignerAssignment.Status != AdminStatus.Active || assignerAssignment.Role != AdminRole.SuperAdmin)
        {
            throw new UnauthorizedAccessException("Only an active SuperAdmin can create admin assignments.");
        }

        var verification = await _memberService.VerifyMemberAsync(membershipId, token);
        if (verification.Status == VerificationStatus.NotFound || verification.Status == VerificationStatus.Invalid)
        {
            throw new InvalidOperationException($"Membership ID {membershipId} was not found in the Tajneed database.");
        }

        if (dto.Role == AdminRole.GeneralAdmin && await _adminAssignmentRepository.HasActiveGeneralAdminForAuxiliaryAsync(dto.Auxiliary, null, token))
        {
            throw new InvalidOperationException($"An active General Admin already exists for {dto.Auxiliary}.");
        }

        var assignment = new AdminAssignment
        {
            Id = Guid.NewGuid(),
            MembershipId = membershipId,
            Auxiliary = dto.Auxiliary,
            Role = dto.Role,
            Status = AdminStatus.Active,
            AssignedBy = assignedBy,
            AssignedAt = DateTime.UtcNow
        };

        await _adminAssignmentRepository.AddAsync(assignment, token);

        var dtos = await EnrichAsync(new[] { assignment }, token);
        return dtos[0];
    }

    public async Task<AdminAssignmentDto?> UpdateAsync(Guid id, UpdateAdminAssignmentDto dto, CancellationToken token = default)
    {
        var assignment = await _adminAssignmentRepository.GetByIdAsync(id, token);
        if (assignment == null)
        {
            return null;
        }

        if (!Enum.IsDefined(dto.Auxiliary) || !Enum.IsDefined(dto.Role) || !Enum.IsDefined(dto.Status))
        {
            throw new InvalidOperationException("Valid auxiliary, role, and status values are required.");
        }

        if (dto.Status == AdminStatus.Active && dto.Role == AdminRole.GeneralAdmin && await _adminAssignmentRepository.HasActiveGeneralAdminForAuxiliaryAsync(dto.Auxiliary, id, token))
        {
            throw new InvalidOperationException($"An active General Admin already exists for {dto.Auxiliary}.");
        }

        var wasActive = assignment.Status == AdminStatus.Active;

        assignment.Auxiliary = dto.Auxiliary;
        assignment.Role = dto.Role;
        assignment.Status = dto.Status;

        if (dto.Status == AdminStatus.Active)
        {
            assignment.RevokedBy = null;
            assignment.RevokedAt = null;
        }
        else if (wasActive)
        {
            var revokedBy = !string.IsNullOrWhiteSpace(dto.RevokedBy)
                ? dto.RevokedBy.Trim()
                : CurrentMembershipId() ?? assignment.RevokedBy;
            assignment.RevokedBy = revokedBy;
            assignment.RevokedAt = DateTime.UtcNow;
        }
        else if (!string.IsNullOrWhiteSpace(dto.RevokedBy))
        {
            assignment.RevokedBy = dto.RevokedBy.Trim();
            assignment.RevokedAt ??= DateTime.UtcNow;
        }

        await _adminAssignmentRepository.UpdateAsync(assignment, token);

        var dtos = await EnrichAsync(new[] { assignment }, token);
        return dtos[0];
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

    private string? CurrentMembershipId() =>
        _httpContextAccessor.HttpContext?.User.GetMembershipId();

    private async Task<List<AdminAssignmentDto>> EnrichAsync(IEnumerable<AdminAssignment> assignments, CancellationToken token)
    {
        var list = assignments.ToList();
        var ids = list
            .SelectMany(x => new[] { x.MembershipId, x.AssignedBy, x.RevokedBy })
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var profiles = await _profileResolver.GetProfilesAsync(ids, token);

        string? NameOf(string? id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return null;
            }

            var key = id.Trim();
            if (profiles.TryGetValue(key, out var profile)
                && profile.Status == VerificationStatus.Verified
                && !string.IsNullOrWhiteSpace(profile.FullName))
            {
                return profile.FullName;
            }

            return TajneedProfileResolver.FallbackName(key);
        }

        return list.Select(assignment => new AdminAssignmentDto
        {
            Id = assignment.Id,
            MembershipId = assignment.MembershipId,
            MemberName = NameOf(assignment.MembershipId),
            Auxiliary = assignment.Auxiliary,
            Role = assignment.Role,
            Status = assignment.Status,
            AssignedBy = assignment.AssignedBy,
            AssignedByName = NameOf(assignment.AssignedBy),
            AssignedAt = assignment.AssignedAt,
            RevokedBy = assignment.RevokedBy,
            RevokedByName = NameOf(assignment.RevokedBy),
            RevokedAt = assignment.RevokedAt
        }).ToList();
    }
}

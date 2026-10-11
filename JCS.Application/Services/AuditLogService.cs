using JCS.Application.Common;
using JCS.Application.DTOs.AuditLog;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;
using JCS.Domain.Enum;
using Microsoft.AspNetCore.Http;

namespace JCS.Application.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IAdminAssignmentRepository _adminAssignmentRepository;
    private readonly ITajneedProfileResolver _profileResolver;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditLogService(
        IAuditLogRepository auditLogRepository,
        IAdminAssignmentRepository adminAssignmentRepository,
        ITajneedProfileResolver profileResolver,
        IHttpContextAccessor httpContextAccessor)
    {
        _auditLogRepository = auditLogRepository;
        _adminAssignmentRepository = adminAssignmentRepository;
        _profileResolver = profileResolver;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<AuditLogDto?> GetByIdAsync(Guid id, CancellationToken token = default)
    {
        var auditLog = await _auditLogRepository.GetByIdAsync(id, token);
        if (auditLog == null)
        {
            return null;
        }

        var dtos = await EnrichAsync(new[] { auditLog }, token);
        return dtos[0];
    }

    public async Task<IReadOnlyCollection<AuditLogDto>> GetAllAsync(CancellationToken token = default)
    {
        var logs = await _auditLogRepository.GetAllAsync(token);
        return await EnrichAsync(logs, token);
    }

    public async Task<IReadOnlyCollection<AuditLogDto>> GetFilteredAsync(DateTime? from, DateTime? to, string? performedBy, string? action, Auxiliary? auxiliary, CancellationToken token = default)
    {
        var logs = await _auditLogRepository.GetFilteredAsync(from, to, performedBy, action, auxiliary, token);
        return await EnrichAsync(logs, token);
    }

    public async Task<AuditLogDto> CreateAsync(CreateAuditLogDto dto, CancellationToken token = default)
    {
        var currentUser = _httpContextAccessor.HttpContext?.User;
        var currentMembershipId = currentUser.GetMembershipId();

        var performedBy = !string.IsNullOrWhiteSpace(currentMembershipId)
            ? currentMembershipId
            : (string.IsNullOrWhiteSpace(dto.PerformedBy) ? "Anonymous" : dto.PerformedBy.Trim());

        Auxiliary? auxiliary = dto.Auxiliary;
        if (!string.IsNullOrWhiteSpace(currentMembershipId))
        {
            auxiliary = ParseAuxiliaryClaim(currentUser?.FindFirst("Auxiliary")?.Value)
                ?? await GetAssignmentAuxiliaryAsync(currentMembershipId, token)
                ?? dto.Auxiliary;
        }

        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = dto.Action,
            PerformedBy = performedBy,
            Auxiliary = auxiliary,
            EntityName = dto.EntityName,
            EntityId = dto.EntityId,
            Details = dto.Details,
            PerformedAt = DateTime.UtcNow
        };

        await _auditLogRepository.AddAsync(auditLog, token);

        var dtos = await EnrichAsync(new[] { auditLog }, token);
        return dtos[0];
    }

    private async Task<List<AuditLogDto>> EnrichAsync(IEnumerable<AuditLog> logs, CancellationToken token)
    {
        var logList = logs.ToList();
        var membershipIds = logList
            .Select(x => x.PerformedBy?.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x) && !string.Equals(x, "Anonymous", StringComparison.OrdinalIgnoreCase))
            .OfType<string>()
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var profiles = await _profileResolver.GetProfilesAsync(membershipIds, token);

        var assignmentTasks = membershipIds.ToDictionary(
            id => id,
            id => GetAssignmentAuxiliaryAsync(id, token),
            StringComparer.OrdinalIgnoreCase);
        await Task.WhenAll(assignmentTasks.Values);

        var result = new List<AuditLogDto>(logList.Count);
        foreach (var log in logList)
        {
            var membershipId = log.PerformedBy?.Trim();
            var isAnonymous = string.IsNullOrWhiteSpace(membershipId)
                || string.Equals(membershipId, "Anonymous", StringComparison.OrdinalIgnoreCase);

            profiles.TryGetValue(membershipId ?? string.Empty, out var profile);
            var assignmentAuxiliary = !isAnonymous
                && assignmentTasks.TryGetValue(membershipId ?? string.Empty, out var auxTask)
                ? SafeResult(auxTask)
                : null;

            var resolvedAuxiliary = log.Auxiliary ?? assignmentAuxiliary ?? profile?.Auxiliary;

            string? performedByName = isAnonymous
                ? "Anonymous"
                : profile?.Status == VerificationStatus.Verified && !string.IsNullOrWhiteSpace(profile.FullName)
                    ? profile.FullName
                    : TajneedProfileResolver.FallbackName(membershipId!);

            result.Add(new AuditLogDto
            {
                Id = log.Id,
                Action = log.Action,
                PerformedBy = log.PerformedBy ?? string.Empty,
                MembershipId = isAnonymous ? null : membershipId,
                PerformedByName = performedByName,
                Auxiliary = resolvedAuxiliary,
                EntityName = log.EntityName,
                EntityId = log.EntityId,
                PerformedAt = log.PerformedAt,
                Details = log.Details
            });
        }

        return result;
    }

    private async Task<Auxiliary?> GetAssignmentAuxiliaryAsync(string membershipId, CancellationToken token)
    {
        try
        {
            var assignment = await _adminAssignmentRepository.GetActiveAssignmentAsync(membershipId, token);
            return assignment?.Auxiliary;
        }
        catch (Exception)
        {
            return null;
        }
    }

    private static Auxiliary? ParseAuxiliaryClaim(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)
            || string.Equals(value, "None", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return Enum.TryParse<Auxiliary>(value, true, out var parsed) ? parsed : null;
    }

    private static Auxiliary? SafeResult(Task<Auxiliary?> task) =>
        task.Status == TaskStatus.RanToCompletion ? task.Result : null;
}

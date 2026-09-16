using JCS.Application.DTOs.AuditLog;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;
using JCS.Domain.Enum;

namespace JCS.Application.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _auditLogRepository;

    public AuditLogService(IAuditLogRepository auditLogRepository)
    {
        _auditLogRepository = auditLogRepository;
    }

    public async Task<AuditLogDto?> GetByIdAsync(Guid id, CancellationToken token = default)
    {
        var auditLog = await _auditLogRepository.GetByIdAsync(id, token);
        if (auditLog == null)
        {
            return null;
        }

        return new AuditLogDto
        {
            Id = auditLog.Id,
            Action = auditLog.Action,
            PerformedBy = auditLog.PerformedBy,
            Auxiliary = auditLog.Auxiliary,
            EntityName = auditLog.EntityName,
            EntityId = auditLog.EntityId,
            PerformedAt = auditLog.PerformedAt,
            Details = auditLog.Details
        };
    }

    public async Task<IReadOnlyCollection<AuditLogDto>> GetAllAsync(CancellationToken token = default)
    {
        var logs = await _auditLogRepository.GetAllAsync(token);
        var resultList = new List<AuditLogDto>();

        foreach (var log in logs)
        {
            resultList.Add(new AuditLogDto
            {
                Id = log.Id,
                Action = log.Action,
                PerformedBy = log.PerformedBy,
                Auxiliary = log.Auxiliary,
                EntityName = log.EntityName,
                EntityId = log.EntityId,
                PerformedAt = log.PerformedAt,
                Details = log.Details
            });
        }

        return resultList;
    }

    public async Task<IReadOnlyCollection<AuditLogDto>> GetFilteredAsync(DateTime? from, DateTime? to, string? performedBy, string? action, Auxiliary? auxiliary, CancellationToken token = default)
    {
        var logs = await _auditLogRepository.GetFilteredAsync(from, to, performedBy, action, auxiliary, token);
        var resultList = new List<AuditLogDto>();

        foreach (var log in logs)
        {
            resultList.Add(new AuditLogDto
            {
                Id = log.Id,
                Action = log.Action,
                PerformedBy = log.PerformedBy,
                Auxiliary = log.Auxiliary,
                EntityName = log.EntityName,
                EntityId = log.EntityId,
                PerformedAt = log.PerformedAt,
                Details = log.Details
            });
        }

        return resultList;
    }

    public async Task<AuditLogDto> CreateAsync(CreateAuditLogDto dto, CancellationToken token = default)
    {
        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = dto.Action,
            PerformedBy = dto.PerformedBy,
            Auxiliary = dto.Auxiliary,
            EntityName = dto.EntityName,
            EntityId = dto.EntityId,
            Details = dto.Details,
            PerformedAt = DateTime.UtcNow
        };

        await _auditLogRepository.AddAsync(auditLog, token);

        return new AuditLogDto
        {
            Id = auditLog.Id,
            Action = auditLog.Action,
            PerformedBy = auditLog.PerformedBy,
            Auxiliary = auditLog.Auxiliary,
            EntityName = auditLog.EntityName,
            EntityId = auditLog.EntityId,
            PerformedAt = auditLog.PerformedAt,
            Details = auditLog.Details
        };
    }
}

using JCS.Application.DTOs.AuditLog;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;

namespace JCS.Application.Services;

public sealed class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _repository;

    public AuditLogService(IAuditLogRepository repository) { _repository = repository; }
    public async Task<AuditLogDto?> GetByIdAsync(Guid id, CancellationToken token = default) => TakeToAuditLogDto(await _repository.GetByIdAsync(id, token));
    public async Task<IReadOnlyCollection<AuditLogDto>> GetAllAsync(CancellationToken token = default) => (await _repository.GetAllAsync(token)).Select(TakeToAuditLogDto).ToArray()!;
    public async Task<AuditLogDto> CreateAsync(CreateAuditLogDto dto, CancellationToken token = default)
    {
        var auditLog = new Domain.Entities.AuditLog { Id = Guid.NewGuid(), Action = dto.Action, PerformedBy = dto.PerformedBy, EntityName = dto.EntityName, EntityId = dto.EntityId, Details = dto.Details, PerformedAt = DateTime.UtcNow };
        await _repository.AddAsync(auditLog, token);
        return TakeToAuditLogDto(auditLog)!;
    }
    private static AuditLogDto? TakeToAuditLogDto(Domain.Entities.AuditLog? auditLog) => auditLog is null ? null : new() { Id = auditLog.Id, Action = auditLog.Action, PerformedBy = auditLog.PerformedBy, EntityName = auditLog.EntityName, EntityId = auditLog.EntityId, PerformedAt = auditLog.PerformedAt, Details = auditLog.Details };
}

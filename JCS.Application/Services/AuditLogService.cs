using JCS.Application.DTOs.AuditLog;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;

namespace JCS.Application.Services.AuditLog;

public sealed class AuditLogService(IAuditLogRepository repo) : IAuditLogService
{
    public async Task<AuditLogDto?> GetByIdAsync(Guid id, CancellationToken t = default) => Map(await repo.GetByIdAsync(id,t));
    public async Task<IReadOnlyCollection<AuditLogDto>> GetAllAsync(CancellationToken t = default) => (await repo.GetAllAsync(t)).Select(x => Map(x)!).ToArray();
    public async Task<AuditLogDto> CreateAsync(CreateAuditLogDto d, CancellationToken t = default) { var e = new Domain.Entities.AuditLog { Id=Guid.NewGuid(), Action=d.Action, PerformedBy=d.PerformedBy, EntityName=d.EntityName, EntityId=d.EntityId, Details=d.Details, PerformedAt=DateTime.UtcNow }; await repo.AddAsync(e,t); return Map(e)!; }
    private static AuditLogDto? Map(Domain.Entities.AuditLog? e) => e is null ? null : new(e.Id,e.Action,e.PerformedBy,e.EntityName,e.EntityId,e.PerformedAt,e.Details);
}

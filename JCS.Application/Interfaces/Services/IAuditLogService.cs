using JCS.Application.DTOs.AuditLog;

namespace JCS.Application.Interfaces.Services;

public interface IAuditLogService
{
    Task<AuditLogDto?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<AuditLogDto>> GetAllAsync(CancellationToken token = default);
    Task<AuditLogDto> CreateAsync(CreateAuditLogDto dto, CancellationToken token = default);
}

using JCS.Application.DTOs.AuditLog;
using JCS.Domain.Enum;

namespace JCS.Application.Interfaces.Services;

public interface IAuditLogService
{
    Task<AuditLogDto?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<AuditLogDto>> GetAllAsync(CancellationToken token = default);
    Task<IReadOnlyCollection<AuditLogDto>> GetFilteredAsync(DateTime? from, DateTime? to, string? performedBy, string? action, Auxiliary? auxiliary, CancellationToken token = default);
    Task<AuditLogDto> CreateAsync(CreateAuditLogDto dto, CancellationToken token = default);
}

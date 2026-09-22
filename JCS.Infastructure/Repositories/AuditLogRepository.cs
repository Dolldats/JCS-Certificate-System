using JCS.Application.Interfaces.Repositories;
using JCS.Domain.Entities;
using JCS.Domain.Enum;
using JCS.Infastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JCS.Infastructure.Repositories;

public sealed class AuditLogRepository : IAuditLogRepository
{
    private readonly JcsDbContext _context;

    public AuditLogRepository(JcsDbContext context)
    {
        _context = context;
    }

    public async Task<AuditLog?> GetByIdAsync(Guid id, CancellationToken token = default)
    {
        return await _context.AuditLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, token);
    }

    public async Task<IReadOnlyCollection<AuditLog>> GetAllAsync(CancellationToken token = default)
    {
        return await _context.AuditLogs
            .AsNoTracking()
            .OrderByDescending(x => x.PerformedAt)
            .ToListAsync(token);
    }

    public async Task<IReadOnlyCollection<AuditLog>> GetFilteredAsync(DateTime? from, DateTime? to, string? performedBy, string? action, Auxiliary? auxiliary, CancellationToken token = default)
    {
        var query = _context.AuditLogs.AsNoTracking().AsQueryable();

        if (from.HasValue)
        {
            query = query.Where(x => x.PerformedAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(x => x.PerformedAt <= to.Value);
        }

        if (!string.IsNullOrWhiteSpace(performedBy))
        {
            query = query.Where(x => x.PerformedBy == performedBy);
        }

        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(x => x.Action == action);
        }

        if (auxiliary.HasValue)
        {
            query = query.Where(x => x.Auxiliary == auxiliary.Value);
        }

        return await query.OrderByDescending(x => x.PerformedAt).ToListAsync(token);
    }

    public async Task AddAsync(AuditLog entity, CancellationToken token = default)
    {
        await _context.AuditLogs.AddAsync(entity, token);
        await _context.SaveChangesAsync(token);
    }
}

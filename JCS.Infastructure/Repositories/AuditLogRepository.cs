using JCS.Application.Interfaces.Repositories;
using JCS.Domain.Entities;
using JCS.Infastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JCS.Infastructure.Repositories;

public sealed class AuditLogRepository : IAuditLogRepository
{
    private readonly JcsDbContext _context;
    public AuditLogRepository(JcsDbContext context) { _context = context; }
    public async Task<AuditLog?> GetByIdAsync(Guid id, CancellationToken token = default) { return await _context.AuditLogs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, token); }
    public async Task<IReadOnlyCollection<AuditLog>> GetAllAsync(CancellationToken token = default) { return await _context.AuditLogs.AsNoTracking().ToListAsync(token); }
    public async Task AddAsync(AuditLog entity, CancellationToken token = default) { await _context.AuditLogs.AddAsync(entity, token); await _context.SaveChangesAsync(token); }
    public async Task UpdateAsync(AuditLog entity, CancellationToken token = default) { _context.AuditLogs.Update(entity); await _context.SaveChangesAsync(token); }
    public async Task DeleteAsync(Guid id, CancellationToken token = default) { var entity=await _context.AuditLogs.FindAsync([id],token); if(entity is null)return; _context.AuditLogs.Remove(entity); await _context.SaveChangesAsync(token); }
}

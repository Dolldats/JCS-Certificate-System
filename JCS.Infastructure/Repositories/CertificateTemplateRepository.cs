using JCS.Application.Interfaces.Repositories;
using JCS.Domain.Entities;
using JCS.Domain.Enum;
using JCS.Infastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JCS.Infastructure.Repositories;

public sealed class CertificateTemplateRepository : ICertificateTemplateRepository
{
    private readonly JcsDbContext _context;

    public CertificateTemplateRepository(JcsDbContext context)
    {
        _context = context;
    }

    public async Task<CertificateTemplate?> GetByIdAsync(Guid id, CancellationToken token = default)
    {
        return await _context.CertificateTemplates.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, token);
    }

    public async Task<IReadOnlyCollection<CertificateTemplate>> GetAllAsync(CancellationToken token = default)
    {
        return await _context.CertificateTemplates.AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(token);
    }

    public async Task<IReadOnlyCollection<CertificateTemplate>> GetActiveTemplatesAsync(Auxiliary? auxiliary, CancellationToken token = default)
    {
        var query = _context.CertificateTemplates.AsNoTracking().Where(x => x.IsActive);
        if (auxiliary.HasValue)
        {
            query = query.Where(x => x.Auxiliary == null || x.Auxiliary == auxiliary.Value);
        }

        return await query.OrderByDescending(x => x.CreatedAt).ToListAsync(token);
    }

    public async Task AddAsync(CertificateTemplate entity, CancellationToken token = default)
    {
        await _context.CertificateTemplates.AddAsync(entity, token);
        await _context.SaveChangesAsync(token);
    }

    public async Task UpdateAsync(CertificateTemplate entity, CancellationToken token = default)
    {
        _context.CertificateTemplates.Update(entity);
        await _context.SaveChangesAsync(token);
    }

    public async Task DeleteAsync(Guid id, CancellationToken token = default)
    {
        var entity = await _context.CertificateTemplates.FirstOrDefaultAsync(x => x.Id == id, token);

        if (entity == null)
        {
            return;
        }

        _context.CertificateTemplates.Remove(entity);
        await _context.SaveChangesAsync(token);
    }
}

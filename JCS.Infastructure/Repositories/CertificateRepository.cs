using JCS.Application.Interfaces.Repositories;
using JCS.Domain.Entities;
using JCS.Infastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JCS.Infastructure.Repositories;

public sealed class CertificateRepository : ICertificateRepository
{
    private readonly JcsDbContext _context;
    public CertificateRepository(JcsDbContext context) 
    {
        _context = context; 
    }

    public async Task<Certificate?> GetByIdAsync(Guid id, CancellationToken token = default)
    {
        return await _context.Certificates.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, token); 
    }

    public async Task<IReadOnlyCollection<Certificate>> GetAllAsync(CancellationToken token = default)
    {
        return await _context.Certificates.AsNoTracking()
            .ToListAsync(token); 
    }

    public async Task AddAsync(Certificate entity, CancellationToken token = default)
    { 
        await _context.Certificates.AddAsync(entity, token);
        await _context.SaveChangesAsync(token); 
    }

    public async Task UpdateAsync(Certificate entity, CancellationToken token = default)
    {
        _context.Certificates.Update(entity); 
        await _context.SaveChangesAsync(token); 
    }

    public async Task DeleteAsync(Guid id, CancellationToken token = default)
    {
        var entity = await _context.Certificates.FindAsync([id],token); 

        if(entity is null)return; 
        _context.Certificates.Remove(entity);
        await _context.SaveChangesAsync(token); }
}

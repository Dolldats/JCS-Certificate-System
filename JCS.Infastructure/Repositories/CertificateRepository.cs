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
            .Include(x => x.Participant)
            .Include(x => x.Event)
            .Include(x => x.CertificateTemplate)
            .FirstOrDefaultAsync(x => x.Id == id, token);
    }

    public async Task<Certificate?> GetByCertificateNumberAsync(string certificateNumber, CancellationToken token = default)
    {
        return await _context.Certificates.AsNoTracking()
            .Include(x => x.Participant)
            .Include(x => x.Event)
            .Include(x => x.CertificateTemplate)
            .FirstOrDefaultAsync(x => x.CertificateNumber == certificateNumber, token);
    }

    public async Task<IReadOnlyCollection<Certificate>> GetAllAsync(CancellationToken token = default)
    {
        return await _context.Certificates.AsNoTracking()
            .Include(x => x.Participant)
            .Include(x => x.Event)
            .Include(x => x.CertificateTemplate)
            .OrderByDescending(x => x.GeneratedAt)
            .ToListAsync(token);
    }

    public async Task<IReadOnlyCollection<Certificate>> GetByEventIdAsync(Guid eventId, CancellationToken token = default)
    {
        return await _context.Certificates.AsNoTracking()
            .Include(x => x.Participant)
            .Include(x => x.Event)
            .Include(x => x.CertificateTemplate)
            .Where(x => x.EventId == eventId)
            .OrderByDescending(x => x.GeneratedAt)
            .ToListAsync(token);
    }

    public async Task<IReadOnlyCollection<Certificate>> GetByParticipantIdAsync(Guid participantId, CancellationToken token = default)
    {
        return await _context.Certificates.AsNoTracking()
            .Include(x => x.Participant)
            .Include(x => x.Event)
            .Include(x => x.CertificateTemplate)
            .Where(x => x.ParticipantId == participantId)
            .ToListAsync(token);
    }

    public async Task AddAsync(Certificate entity, CancellationToken token = default)
    {
        await _context.Certificates.AddAsync(entity, token);
        await _context.SaveChangesAsync(token);
    }

    public async Task AddRangeAsync(IEnumerable<Certificate> entities, CancellationToken token = default)
    {
        await _context.Certificates.AddRangeAsync(entities, token);
        await _context.SaveChangesAsync(token);
    }

    public async Task UpdateAsync(Certificate entity, CancellationToken token = default)
    {
        _context.Certificates.Update(entity);
        await _context.SaveChangesAsync(token);
    }

    public async Task DeleteAsync(Guid id, CancellationToken token = default)
    {
        var entity = await _context.Certificates.FirstOrDefaultAsync(x => x.Id == id, token);

        if (entity == null)
        {
            return;
        }

        _context.Certificates.Remove(entity);
        await _context.SaveChangesAsync(token);
    }
}

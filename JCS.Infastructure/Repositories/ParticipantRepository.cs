using JCS.Application.Interfaces.Repositories;
using JCS.Domain.Entities;
using JCS.Infastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JCS.Infastructure.Repositories;

public sealed class ParticipantRepository : IParticipantRepository
{
    private readonly JcsDbContext _context;
    public ParticipantRepository(JcsDbContext context) 
    {
        _context = context; 
    }

    public async Task<Participant?> GetByIdAsync(Guid id, CancellationToken token = default)
    {
        return await _context.Participants.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, token); 
    }

    public async Task<IReadOnlyCollection<Participant>> GetAllAsync(CancellationToken token = default)
    {
        return await _context.Participants.AsNoTracking()
            .ToListAsync(token); 
    }

    public async Task AddAsync(Participant entity, CancellationToken token = default)
    {
        await _context.Participants.AddAsync(entity, token); 
        await _context.SaveChangesAsync(token); 
    }

    public async Task UpdateAsync(Participant entity, CancellationToken token = default)
    {
        _context.Participants.Update(entity); 
        await _context.SaveChangesAsync(token); 
    }

    public async Task DeleteAsync(Guid id, CancellationToken token = default)
    { 
        var entity=await _context.Participants.FindAsync([id],token); 
        
        if(entity is null)return;
        _context.Participants.Remove(entity); 
        await _context.SaveChangesAsync(token); 
    }
}

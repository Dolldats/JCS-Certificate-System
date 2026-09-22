using JCS.Application.Interfaces.Repositories;
using JCS.Domain.Entities;
using JCS.Domain.Enum;
using JCS.Infastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JCS.Infastructure.Repositories;

public sealed class EventRepository : IEventRepository
{
    private readonly JcsDbContext _context;

    public EventRepository(JcsDbContext context)
    {
        _context = context;
    }

    public async Task<Event?> GetByIdAsync(Guid id, CancellationToken token = default)
    {
        return await _context.Events.AsNoTracking()
            .Include(x => x.Participants)
            .Include(x => x.Certificates)
            .FirstOrDefaultAsync(x => x.Id == id, token);
    }

    public async Task<IReadOnlyCollection<Event>> GetAllAsync(CancellationToken token = default)
    {
        return await _context.Events.AsNoTracking()
            .Include(x => x.Participants)
            .Include(x => x.Certificates)
            .OrderByDescending(x => x.EventDate)
            .ToListAsync(token);
    }

    public async Task<IReadOnlyCollection<Event>> GetByAuxiliaryAsync(Auxiliary auxiliary, CancellationToken token = default)
    {
        return await _context.Events.AsNoTracking()
            .Include(x => x.Participants)
            .Include(x => x.Certificates)
            .Where(x => x.Auxiliary == auxiliary)
            .OrderByDescending(x => x.EventDate)
            .ToListAsync(token);
    }

    public async Task AddAsync(Event entity, CancellationToken token = default)
    {
        await _context.Events.AddAsync(entity, token);
        await _context.SaveChangesAsync(token);
    }

    public async Task UpdateAsync(Event entity, CancellationToken token = default)
    {
        _context.Events.Update(entity);
        await _context.SaveChangesAsync(token);
    }

    public async Task DeleteAsync(Guid id, CancellationToken token = default)
    {
        var entity = await _context.Events.FirstOrDefaultAsync(x => x.Id == id, token);

        if (entity == null)
        {
            return;
        }

        _context.Events.Remove(entity);
        await _context.SaveChangesAsync(token);
    }
}

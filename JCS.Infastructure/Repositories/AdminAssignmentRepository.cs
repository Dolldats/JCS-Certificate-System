using JCS.Application.Interfaces.Repositories;
using JCS.Domain.Entities;
using JCS.Domain.Enum;
using JCS.Infastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JCS.Infastructure.Repositories;

public sealed class AdminAssignmentRepository : IAdminAssignmentRepository
{
    private readonly JcsDbContext _context;

    public AdminAssignmentRepository(JcsDbContext context)
    {
        _context = context;
    }

    public async Task<AdminAssignment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.AdminAssignments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<AdminAssignment>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AdminAssignments
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<AdminAssignment?> GetActiveAssignmentAsync(string membershipId, CancellationToken cancellationToken = default)
    {
        return await _context.AdminAssignments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.MembershipId == membershipId && x.Status == AdminStatus.Active, cancellationToken);
    }

    public async Task AddAsync(AdminAssignment assignment, CancellationToken cancellationToken = default)
    {
        await _context.AdminAssignments.AddAsync(assignment, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(AdminAssignment assignment, CancellationToken cancellationToken = default)
    {
        _context.AdminAssignments.Update(assignment);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var assignment = await _context.AdminAssignments.FindAsync([id], cancellationToken);

        if (assignment is null) return;
        _context.AdminAssignments.Remove(assignment);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

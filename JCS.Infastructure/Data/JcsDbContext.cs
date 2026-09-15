using JCS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace JCS.Infastructure.Persistence;

public sealed class JcsDbContext : DbContext
{
    public JcsDbContext(DbContextOptions<JcsDbContext> options)
        : base(options)
    {
    }

    public DbSet<AdminAssignment> AdminAssignments => Set<AdminAssignment>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Participant> Participants => Set<Participant>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<CertificateTemplate> CertificateTemplates => Set<CertificateTemplate>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(JcsDbContext).Assembly);
    }
}

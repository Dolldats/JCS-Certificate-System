using JCS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JCS.Infastructure.Data.EntityConfigurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.PerformedAt);

        builder.HasIndex(x => x.Action);

        builder.Property(x => x.Action)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.PerformedBy)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.EntityName)
            .HasMaxLength(100);

        builder.Property(x => x.EntityId)
            .HasMaxLength(100);
    }
}

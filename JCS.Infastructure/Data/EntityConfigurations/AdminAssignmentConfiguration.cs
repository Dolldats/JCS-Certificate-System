using JCS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JCS.Infastructure.Data.EntityConfigurations;

public sealed class AdminAssignmentConfiguration : IEntityTypeConfiguration<AdminAssignment>
{
    public void Configure(EntityTypeBuilder<AdminAssignment> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.MembershipId)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.AssignedBy)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.RevokedBy)
            .HasMaxLength(100);

        builder.HasIndex(x => new { x.MembershipId, x.Status });
    }
}

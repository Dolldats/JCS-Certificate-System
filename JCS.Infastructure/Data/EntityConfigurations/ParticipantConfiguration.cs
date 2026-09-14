using JCS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JCS.Infastructure.Data.EntityConfigurations;

public sealed class ParticipantConfiguration : IEntityTypeConfiguration<Participant>
{
    public void Configure(EntityTypeBuilder<Participant> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.MembershipId)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(x => x.MembershipId)
            .IsUnique();

        builder.Property(x => x.FullName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.VerificationStatus)
            .IsRequired()
            .HasMaxLength(50);
    }
}

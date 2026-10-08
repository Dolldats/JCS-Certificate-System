using JCS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JCS.Infastructure.Data.EntityConfigurations;

public class ParticipantConfiguration : IEntityTypeConfiguration<Participant>
{
    public void Configure(EntityTypeBuilder<Participant> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.MembershipId)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.FullName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Email)
            .HasMaxLength(200);

        builder.Property(x => x.Phone)
            .HasMaxLength(50);

        builder.Property(x => x.Jamaat)
            .HasMaxLength(150);

        builder.Property(x => x.Dila)
            .HasMaxLength(150);

        builder.Property(x => x.Ilaqa)
            .HasMaxLength(150);

        builder.Property(x => x.VerificationMessage)
            .HasMaxLength(500);

        builder.HasIndex(x => new { x.EventId, x.MembershipId })
            .IsUnique();

        builder.HasOne(x => x.Event)
            .WithMany(e => e.Participants)
            .HasForeignKey(x => x.EventId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

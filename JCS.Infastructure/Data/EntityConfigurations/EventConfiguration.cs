using JCS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JCS.Infastructure.Data.EntityConfigurations;

public class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Venue)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.OrganizationalUnit)
            .HasMaxLength(150);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasMany(x => x.Participants)
            .WithOne(p => p.Event)
            .HasForeignKey(p => p.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Certificates)
            .WithOne(c => c.Event)
            .HasForeignKey(c => c.EventId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

using JCS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JCS.Infastructure.Data.EntityConfigurations;

public class CertificateConfiguration : IEntityTypeConfiguration<Certificate>
{
    public void Configure(EntityTypeBuilder<Certificate> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.CertificateNumber)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(x => x.CertificateNumber)
            .IsUnique();

        builder.Property(x => x.FilePath)
            .HasMaxLength(500);

        builder.Property(x => x.RevocationReason)
            .HasMaxLength(500);

        builder.Property(x => x.RevokedBy)
            .HasMaxLength(100);

        builder.HasOne(x => x.Participant)
            .WithMany(p => p.Certificates)
            .HasForeignKey(x => x.ParticipantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Event)
            .WithMany(e => e.Certificates)
            .HasForeignKey(x => x.EventId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.CertificateTemplate)
            .WithMany(t => t.Certificates)
            .HasForeignKey(x => x.CertificateTemplateId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

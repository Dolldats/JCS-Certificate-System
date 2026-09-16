using JCS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JCS.Infastructure.Data.EntityConfigurations;

public sealed class CertificateTemplateConfiguration : IEntityTypeConfiguration<CertificateTemplate>
{
    public void Configure(EntityTypeBuilder<CertificateTemplate> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.FilePath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.Orientation)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(x => x.PageSize)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(x => x.Width)
            .HasPrecision(18, 2);

        builder.Property(x => x.Height)
            .HasPrecision(18, 2);

        builder.Property(x => x.BackgroundImagePath)
            .HasMaxLength(500);

        builder.HasMany(x => x.Certificates)
            .WithOne(c => c.CertificateTemplate)
            .HasForeignKey(c => c.CertificateTemplateId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

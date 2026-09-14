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
    }
}

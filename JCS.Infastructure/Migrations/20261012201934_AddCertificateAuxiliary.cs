using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JCS.Infastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCertificateAuxiliary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Certificates\" ADD COLUMN IF NOT EXISTS \"Auxiliary\" integer NOT NULL DEFAULT 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Certificates\" DROP COLUMN IF EXISTS \"Auxiliary\";");
        }
    }
}

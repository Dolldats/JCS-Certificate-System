using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JCS.Infastructure.Migrations
{
    public partial class AddCertificateTemplateDimensions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Width",
                table: "CertificateTemplates",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Height",
                table: "CertificateTemplates",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "BackgroundImagePath",
                table: "CertificateTemplates",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "Width", table: "CertificateTemplates");
            migrationBuilder.DropColumn(name: "Height", table: "CertificateTemplates");
            migrationBuilder.DropColumn(name: "BackgroundImagePath", table: "CertificateTemplates");
        }
    }
}

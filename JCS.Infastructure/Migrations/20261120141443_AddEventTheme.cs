using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JCS.Infastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEventTheme : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Theme",
                table: "Events",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Theme",
                table: "Events");
        }
    }
}

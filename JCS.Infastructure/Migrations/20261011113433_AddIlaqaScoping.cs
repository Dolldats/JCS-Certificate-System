using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JCS.Infastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIlaqaScoping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Ilaqa",
                table: "Events",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Ilaqa",
                table: "AdminAssignments",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Ilaqa",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "Ilaqa",
                table: "AdminAssignments");
        }
    }
}

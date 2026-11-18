using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JCS.Infastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStateAdministration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "State",
                table: "Participants",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "State",
                table: "AdminAssignments",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "State",
                table: "Participants");

            migrationBuilder.DropColumn(
                name: "State",
                table: "AdminAssignments");
        }
    }
}

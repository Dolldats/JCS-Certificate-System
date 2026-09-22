
namespace JCS.API
{
    using JCS.Application.Interfaces.Repositories;
    using JCS.Application.Interfaces.Services;
    using JCS.Application.Services;
    using JCS.Infastructure.Persistence;
    using JCS.Infastructure.Repositories;
    using Microsoft.EntityFrameworkCore;
    using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Logging.ClearProviders();
            builder.Logging.AddConsole();

            // Add services to the container.

            builder.Services.AddControllers();
            builder.Services.AddProblemDetails();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection is not configured.");

            builder.Services.AddDbContext<JcsDbContext>(options =>
                options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
            builder.Services.AddScoped<IAdminAssignmentRepository, AdminAssignmentRepository>();
            builder.Services.AddScoped<IEventRepository, EventRepository>();
            builder.Services.AddScoped<IParticipantRepository, ParticipantRepository>();
            builder.Services.AddScoped<ICertificateRepository, CertificateRepository>();
            builder.Services.AddScoped<ICertificateTemplateRepository, CertificateTemplateRepository>();
            builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
            builder.Services.AddScoped<IEventService, EventService>();
            builder.Services.AddScoped<IParticipantService, ParticipantService>();
            builder.Services.AddScoped<ICertificateService, CertificateService>();
            builder.Services.AddScoped<ICertificateTemplateService, CertificateTemplateService>();
            builder.Services.AddSingleton<IPlaceholderEngine, PlaceholderEngine>();
            builder.Services.AddSingleton<ICertificateRenderer, CertificateRenderer>();
            builder.Services.AddScoped<IAssetStorageService>(_ => new AssetStorageService(builder.Environment.ContentRootPath));
            builder.Services.AddSingleton<IJamaatMemberService, MockJamaatMemberService>();

            builder.Services.AddScoped<IAuditLogService, AuditLogService>();
            builder.Services.AddScoped<IAdminAssignmentService, AdminAssignmentService>();

            var app = builder.Build();

            // Keep the database schema synchronized with the entity model before
            // accepting requests. Without this, a pending migration can make
            // every repository query fail with a generic HTTP 500.
            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<JcsDbContext>();
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

                try
                {
                    db.Database.Migrate();
                }
                catch (Exception exception)
                {
                    logger.LogCritical(exception, "Database migration failed. The API cannot safely serve requests.");
                    throw;
                }
            }


            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger(c =>
                {
                    c.SerializeAsV2 = false;
                });
                app.UseSwaggerUI();
            }

            app.UseExceptionHandler();

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}

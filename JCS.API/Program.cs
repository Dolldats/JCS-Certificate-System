
using JCS.Application.Common;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Application.Services;
using JCS.Infastructure.Persistence;
using JCS.Infastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using JCS.API.Filters;
using Microsoft.OpenApi.Models;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace JCS.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Logging.ClearProviders();
            builder.Logging.AddConsole();

            // Add services to the container.

            builder.Services.AddScoped<AuditActionFilter>();
            builder.Services.AddControllers(options => options.Filters.AddService<AuditActionFilter>()).AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });
            builder.Services.AddProblemDetails();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Enter JWT Bearer token"
                });
                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });
            var jwtSecret = builder.Configuration["Jwt:Secret"] ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true
                };
            });
            builder.Services.AddAuthorization();
            builder.Services.AddHttpContextAccessor();
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
            var jamaatOptions = builder.Configuration.GetSection("JamaatApi").Get<JamaatApiOptions>() ?? new JamaatApiOptions();
            builder.Services.AddSingleton(jamaatOptions);
            builder.Services.AddSingleton<IJamaatTokenStore, JamaatTokenStore>();
            builder.Services.AddHttpClient<IJamaatAuthService, JamaatAuthService>();
            builder.Services.AddHttpClient<IJamaatMemberService, JamaatApiMemberService>();

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
                    var initialSuperAdminMembershipId = builder.Configuration["InitialSuperAdminMembershipId"];
                    if (!string.IsNullOrWhiteSpace(initialSuperAdminMembershipId))
                    {
                        var existing = db.AdminAssignments.FirstOrDefault(x =>
                            x.MembershipId == initialSuperAdminMembershipId &&
                            x.Role == JCS.Domain.Enum.AdminRole.SuperAdmin);

                        if (existing == null)
                        {
                            db.AdminAssignments.Add(new JCS.Domain.Entities.AdminAssignment
                            {
                                Id = Guid.NewGuid(),
                                MembershipId = initialSuperAdminMembershipId.Trim(),
                                Auxiliary = JCS.Domain.Enum.Auxiliary.Khuddam,
                                Role = JCS.Domain.Enum.AdminRole.SuperAdmin,
                                Status = JCS.Domain.Enum.AdminStatus.Active,
                                AssignedBy = "System",
                                AssignedAt = DateTime.UtcNow
                            });
                            db.SaveChanges();
                            logger.LogInformation("Initial Super Admin assignment was created.");
                        }
                        else if (existing.Auxiliary != JCS.Domain.Enum.Auxiliary.Khuddam)
                        {
                            existing.Auxiliary = JCS.Domain.Enum.Auxiliary.Khuddam;
                            db.SaveChanges();
                            logger.LogInformation("Updated initial Super Admin auxiliary to Khuddam.");
                        }
                    }
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

            app.UseAuthentication();
            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}

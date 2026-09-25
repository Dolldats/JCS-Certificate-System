
using JCS.Application.Common;
using JCS.Application;
using JCS.Infastructure.Persistence;
using JCS.Infastructure;
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
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };
                options.Events = new JwtBearerEvents
                {
                    OnChallenge = context =>
                    {
                        context.HandleResponse();
                        context.Response.StatusCode = 401;
                        context.Response.ContentType = "application/json";
                        var isExpired = context.AuthenticateFailure is SecurityTokenExpiredException;
                        var result = System.Text.Json.JsonSerializer.Serialize(new 
                        { 
                            message = isExpired ? "Token Expired" : "Unauthorized",
                            isExpired = isExpired
                        });
                        return context.Response.WriteAsync(result);
                    }
                };
            });
            builder.Services.AddAuthorization();
            builder.Services.AddHttpContextAccessor();
            builder.Services
                .AddApplicationServices(builder.Environment.ContentRootPath)
                .AddInfrastructure(builder.Configuration);

            var app = builder.Build();
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

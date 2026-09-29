using JCS.Application.Common;
using JCS.Application.Interfaces.Repositories;
using JCS.Infastructure.Persistence;
using JCS.Infastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace JCS.Infastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");

        services.AddDbContext<JcsDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IAdminAssignmentRepository, AdminAssignmentRepository>();
        services.AddScoped<IEventRepository, EventRepository>();
        services.AddScoped<IParticipantRepository, ParticipantRepository>();
        services.AddScoped<ICertificateRepository, CertificateRepository>();
        services.AddScoped<ICertificateTemplateRepository, CertificateTemplateRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();

        var jamaatOptions = configuration.GetSection("JamaatApi").Get<JamaatApiOptions>() ?? new JamaatApiOptions();
        services.AddSingleton(jamaatOptions);

        return services;
    }
}

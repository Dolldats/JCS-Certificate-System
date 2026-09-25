using JCS.Application.Common;
using JCS.Application.Interfaces.Services;
using JCS.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace JCS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, string contentRootPath)
    {
        services.AddScoped<IEventService, EventService>();
        services.AddScoped<IParticipantService, ParticipantService>();
        services.AddScoped<ICertificateService, CertificateService>();
        services.AddScoped<ICertificateTemplateService, CertificateTemplateService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IAdminAssignmentService, AdminAssignmentService>();
        services.AddSingleton<IPlaceholderEngine, PlaceholderEngine>();
        services.AddSingleton<ICertificateRenderer, CertificateRenderer>();
        services.AddSingleton<IJamaatTokenStore, JamaatTokenStore>();
        services.AddHttpClient<IJamaatAuthService, JamaatAuthService>();
        services.AddHttpClient<IJamaatMemberService, JamaatApiMemberService>();
        services.AddScoped<IAssetStorageService>(_ => new AssetStorageService(contentRootPath));

        return services;
    }
}

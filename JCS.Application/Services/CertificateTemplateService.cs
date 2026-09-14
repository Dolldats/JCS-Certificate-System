using JCS.Application.DTOs.CertificateTemplate;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;

namespace JCS.Application.Services;

public sealed class CertificateTemplateService(ICertificateTemplateRepository repo) : ICertificateTemplateService
{
    public async Task<CertificateTemplateDto?> GetByIdAsync(Guid id, CancellationToken t = default) => Map(await repo.GetByIdAsync(id, t));
    public async Task<IReadOnlyCollection<CertificateTemplateDto>> GetAllAsync(CancellationToken t = default) => (await repo.GetAllAsync(t)).Select(x => Map(x)!).ToArray();
    public async Task<CertificateTemplateDto> CreateAsync(CreateCertificateTemplateDto d, CancellationToken t = default) { var e = new CertificateTemplate { Id = Guid.NewGuid(), Name=d.Name, Description=d.Description, FilePath=d.FilePath, ConfigurationJson=d.ConfigurationJson }; await repo.AddAsync(e,t); return Map(e)!; }
    public async Task<CertificateTemplateDto?> UpdateAsync(Guid id, UpdateCertificateTemplateDto d, CancellationToken t = default) { var e=await repo.GetByIdAsync(id,t); if(e is null)return null; e.Name=d.Name;e.Description=d.Description;e.FilePath=d.FilePath;e.ConfigurationJson=d.ConfigurationJson;e.IsActive=d.IsActive;await repo.UpdateAsync(e,t);return Map(e); }
    public async Task<bool> DeleteAsync(Guid id, CancellationToken t = default) { if(await repo.GetByIdAsync(id,t) is null)return false; await repo.DeleteAsync(id,t); return true; }
    private static CertificateTemplateDto? Map(CertificateTemplate? e) => e is null ? null : new(e.Id,e.Name,e.Description,e.FilePath,e.ConfigurationJson,e.IsActive);
}

using JCS.Application.DTOs.CertificateTemplate;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;

namespace JCS.Application.Services;

public sealed class CertificateTemplateService : ICertificateTemplateService
{
    private readonly ICertificateTemplateRepository _repository;
    public CertificateTemplateService(ICertificateTemplateRepository repository) { _repository = repository; }
    public async Task<CertificateTemplateDto?> GetByIdAsync(Guid id, CancellationToken t = default) => Map(await _repository.GetByIdAsync(id, t));
    public async Task<IReadOnlyCollection<CertificateTemplateDto>> GetAllAsync(CancellationToken t = default) => (await _repository.GetAllAsync(t)).Select(x => Map(x)!).ToArray();
    public async Task<CertificateTemplateDto> CreateAsync(CreateCertificateTemplateDto d, CancellationToken t = default) { var e = new CertificateTemplate { Id = Guid.NewGuid(), Name=d.Name, Description=d.Description, FilePath=d.FilePath, ConfigurationJson=d.ConfigurationJson }; await _repository.AddAsync(e,t); return Map(e)!; }
    public async Task<CertificateTemplateDto?> UpdateAsync(Guid id, UpdateCertificateTemplateDto d, CancellationToken t = default) { var e=await _repository.GetByIdAsync(id,t); if(e is null)return null; e.Name=d.Name;e.Description=d.Description;e.FilePath=d.FilePath;e.ConfigurationJson=d.ConfigurationJson;e.IsActive=d.IsActive;await _repository.UpdateAsync(e,t);return Map(e); }
    public async Task<bool> DeleteAsync(Guid id, CancellationToken t = default) { if(await _repository.GetByIdAsync(id,t) is null)return false; await _repository.DeleteAsync(id,t); return true; }
    private static CertificateTemplateDto? Map(CertificateTemplate? e) => e is null ? null : new() { Id=e.Id, Name=e.Name, Description=e.Description, FilePath=e.FilePath, ConfigurationJson=e.ConfigurationJson, IsActive=e.IsActive };
}

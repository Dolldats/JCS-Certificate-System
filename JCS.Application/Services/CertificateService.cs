using JCS.Application.DTOs.Certificate;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;

namespace JCS.Application.Services;

public sealed class CertificateService(ICertificateRepository repo) : ICertificateService
{
    public async Task<CertificateDto?> GetByIdAsync(Guid id,CancellationToken t=default)=>Map(await repo.GetByIdAsync(id,t));
    public async Task<IReadOnlyCollection<CertificateDto>> GetAllAsync(CancellationToken t=default)=>(await repo.GetAllAsync(t)).Select(x => Map(x)!).ToArray();
    public async Task<CertificateDto> CreateAsync(CreateCertificateDto d,CancellationToken t=default){var e=new Certificate{Id=Guid.NewGuid(),CertificateNumber=d.CertificateNumber,ParticipantId=d.ParticipantId,EventId=d.EventId,CertificateTemplateId=d.CertificateTemplateId,CertificateType=d.CertificateType,GeneratedAt=DateTime.UtcNow};await repo.AddAsync(e,t);return Map(e)!;}
    public async Task<CertificateDto?> UpdateAsync(Guid id,UpdateCertificateDto d,CancellationToken t=default){var e=await repo.GetByIdAsync(id,t);if(e is null)return null;e.Status=d.Status;e.FilePath=d.FilePath;await repo.UpdateAsync(e,t);return Map(e);}
    public async Task<bool> DeleteAsync(Guid id,CancellationToken t=default){if(await repo.GetByIdAsync(id,t)is null)return false;await repo.DeleteAsync(id,t);return true;}
    private static CertificateDto? Map(Certificate? e)=>e is null?null:new(e.Id,e.CertificateNumber,e.ParticipantId,e.EventId,e.CertificateTemplateId,e.CertificateType,e.Status,e.GeneratedAt,e.FilePath);
}

using JCS.Application.DTOs.Certificate;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;

namespace JCS.Application.Services;

public sealed class CertificateService : ICertificateService
{
    private readonly ICertificateRepository _repository;
    public CertificateService(ICertificateRepository repository) { _repository = repository; }
    public async Task<CertificateDto?> GetByIdAsync(Guid id, CancellationToken token = default) => TakeToCertificateDto(await _repository.GetByIdAsync(id, token));
    public async Task<IReadOnlyCollection<CertificateDto>> GetAllAsync(CancellationToken token = default) => (await _repository.GetAllAsync(token)).Select(TakeToCertificateDto).ToArray()!;
    public async Task<CertificateDto> CreateAsync(CreateCertificateDto dto, CancellationToken token = default)
    {
        var certificate = new Certificate { Id = Guid.NewGuid(), CertificateNumber = dto.CertificateNumber, ParticipantId = dto.ParticipantId, EventId = dto.EventId, CertificateTemplateId = dto.CertificateTemplateId, CertificateType = dto.CertificateType, GeneratedAt = DateTime.UtcNow };
        await _repository.AddAsync(certificate, token);
        return TakeToCertificateDto(certificate)!;
    }
    public async Task<CertificateDto?> UpdateAsync(Guid id, UpdateCertificateDto dto, CancellationToken token = default)
    {
        var certificate = await _repository.GetByIdAsync(id, token); if (certificate is null) return null;
        certificate.Status = dto.Status; certificate.FilePath = dto.FilePath;
        await _repository.UpdateAsync(certificate, token); return TakeToCertificateDto(certificate);
    }
    public async Task<bool> DeleteAsync(Guid id, CancellationToken token = default)
    { if (await _repository.GetByIdAsync(id, token) is null) return false; await _repository.DeleteAsync(id, token); return true; }
    private static CertificateDto? TakeToCertificateDto(Certificate? certificate) => certificate is null ? null : new() { Id = certificate.Id, CertificateNumber = certificate.CertificateNumber, ParticipantId = certificate.ParticipantId, EventId = certificate.EventId, CertificateTemplateId = certificate.CertificateTemplateId, CertificateType = certificate.CertificateType, Status = certificate.Status, GeneratedAt = certificate.GeneratedAt, FilePath = certificate.FilePath };
}

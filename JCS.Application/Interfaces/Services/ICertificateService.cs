using JCS.Application.DTOs.Certificate;

namespace JCS.Application.Interfaces.Services;

public interface ICertificateService
{
    Task<CertificateDto?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<CertificateDto?> GetByCertificateNumberAsync(string certificateNumber, CancellationToken token = default);
    Task<IReadOnlyCollection<CertificateDto>> GetAllAsync(CancellationToken token = default);
    Task<IReadOnlyCollection<CertificateDto>> GetByEventIdAsync(Guid eventId, CancellationToken token = default);
    Task<CertificateDto> CreateAsync(CreateCertificateDto dto, CancellationToken token = default);
    Task<CertificateDto?> UpdateAsync(Guid id, UpdateCertificateDto dto, CancellationToken token = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken token = default);
}

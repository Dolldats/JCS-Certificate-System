using JCS.Application.DTOs.CertificateTemplate;
using JCS.Domain.Enum;

namespace JCS.Application.Interfaces.Services;

public interface ICertificateTemplateService
{
    Task<CertificateTemplateDto?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<CertificateTemplateDto>> GetAllAsync(CancellationToken token = default);
    Task<IReadOnlyCollection<CertificateTemplateDto>> GetActiveTemplatesAsync(Auxiliary? auxiliary, CancellationToken token = default);
    Task<CertificateTemplateDto> CreateAsync(CreateCertificateTemplateDto dto, CancellationToken token = default);
    Task<CertificateTemplateDto?> UpdateAsync(Guid id, UpdateCertificateTemplateDto dto, CancellationToken token = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken token = default);
}

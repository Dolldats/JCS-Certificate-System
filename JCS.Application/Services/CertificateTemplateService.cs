using JCS.Application.DTOs.CertificateTemplate;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;
using JCS.Domain.Enum;

namespace JCS.Application.Services;

public sealed class CertificateTemplateService : ICertificateTemplateService
{
    private readonly ICertificateTemplateRepository _templateRepository;

    public CertificateTemplateService(ICertificateTemplateRepository templateRepository)
    {
        _templateRepository = templateRepository;
    }

    public async Task<CertificateTemplateDto?> GetByIdAsync(Guid id, CancellationToken token = default)
    {
        var template = await _templateRepository.GetByIdAsync(id, token);
        if (template == null)
        {
            return null;
        }

        return new CertificateTemplateDto
        {
            Id = template.Id,
            Name = template.Name,
            Description = template.Description,
            Auxiliary = template.Auxiliary,
            FilePath = template.FilePath,
            ConfigurationJson = template.ConfigurationJson,
            Orientation = template.Orientation,
            PageSize = template.PageSize,
            IsActive = template.IsActive,
            CreatedAt = template.CreatedAt
        };
    }

    public async Task<IReadOnlyCollection<CertificateTemplateDto>> GetAllAsync(CancellationToken token = default)
    {
        var templates = await _templateRepository.GetAllAsync(token);
        var resultList = new List<CertificateTemplateDto>();

        foreach (var template in templates)
        {
            resultList.Add(new CertificateTemplateDto
            {
                Id = template.Id,
                Name = template.Name,
                Description = template.Description,
                Auxiliary = template.Auxiliary,
                FilePath = template.FilePath,
                ConfigurationJson = template.ConfigurationJson,
                Orientation = template.Orientation,
                PageSize = template.PageSize,
                IsActive = template.IsActive,
                CreatedAt = template.CreatedAt
            });
        }

        return resultList;
    }

    public async Task<IReadOnlyCollection<CertificateTemplateDto>> GetActiveTemplatesAsync(Auxiliary? auxiliary, CancellationToken token = default)
    {
        var templates = await _templateRepository.GetActiveTemplatesAsync(auxiliary, token);
        var resultList = new List<CertificateTemplateDto>();

        foreach (var template in templates)
        {
            resultList.Add(new CertificateTemplateDto
            {
                Id = template.Id,
                Name = template.Name,
                Description = template.Description,
                Auxiliary = template.Auxiliary,
                FilePath = template.FilePath,
                ConfigurationJson = template.ConfigurationJson,
                Orientation = template.Orientation,
                PageSize = template.PageSize,
                IsActive = template.IsActive,
                CreatedAt = template.CreatedAt
            });
        }

        return resultList;
    }

    public async Task<CertificateTemplateDto> CreateAsync(CreateCertificateTemplateDto dto, CancellationToken token = default)
    {
        var template = new CertificateTemplate
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            Auxiliary = dto.Auxiliary,
            FilePath = dto.FilePath,
            ConfigurationJson = dto.ConfigurationJson,
            Orientation = dto.Orientation,
            PageSize = dto.PageSize,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _templateRepository.AddAsync(template, token);

        return new CertificateTemplateDto
        {
            Id = template.Id,
            Name = template.Name,
            Description = template.Description,
            Auxiliary = template.Auxiliary,
            FilePath = template.FilePath,
            ConfigurationJson = template.ConfigurationJson,
            Orientation = template.Orientation,
            PageSize = template.PageSize,
            IsActive = template.IsActive,
            CreatedAt = template.CreatedAt
        };
    }

    public async Task<CertificateTemplateDto?> UpdateAsync(Guid id, UpdateCertificateTemplateDto dto, CancellationToken token = default)
    {
        var template = await _templateRepository.GetByIdAsync(id, token);
        if (template == null)
        {
            return null;
        }

        template.Name = dto.Name;
        template.Description = dto.Description;
        template.Auxiliary = dto.Auxiliary;
        template.FilePath = dto.FilePath;
        template.ConfigurationJson = dto.ConfigurationJson;
        template.Orientation = dto.Orientation;
        template.PageSize = dto.PageSize;
        template.IsActive = dto.IsActive;

        await _templateRepository.UpdateAsync(template, token);

        return new CertificateTemplateDto
        {
            Id = template.Id,
            Name = template.Name,
            Description = template.Description,
            Auxiliary = template.Auxiliary,
            FilePath = template.FilePath,
            ConfigurationJson = template.ConfigurationJson,
            Orientation = template.Orientation,
            PageSize = template.PageSize,
            IsActive = template.IsActive,
            CreatedAt = template.CreatedAt
        };
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken token = default)
    {
        var template = await _templateRepository.GetByIdAsync(id, token);
        if (template == null)
        {
            return false;
        }

        await _templateRepository.DeleteAsync(id, token);
        return true;
    }
}

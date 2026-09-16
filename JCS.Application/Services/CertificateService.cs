using JCS.Application.DTOs.Certificate;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;
using JCS.Domain.Enum;

namespace JCS.Application.Services;

public sealed class CertificateService : ICertificateService
{
    private readonly ICertificateRepository _certificateRepository;

    public CertificateService(ICertificateRepository certificateRepository)
    {
        _certificateRepository = certificateRepository;
    }

    public async Task<CertificateDto?> GetByIdAsync(Guid id, CancellationToken token = default)
    {
        var certificate = await _certificateRepository.GetByIdAsync(id, token);
        if (certificate == null)
        {
            return null;
        }

        return new CertificateDto
        {
            Id = certificate.Id,
            CertificateNumber = certificate.CertificateNumber,
            ParticipantId = certificate.ParticipantId,
            ParticipantName = certificate.Participant != null ? certificate.Participant.FullName : null,
            ParticipantMembershipId = certificate.Participant != null ? certificate.Participant.MembershipId : null,
            EventId = certificate.EventId,
            EventName = certificate.Event != null ? certificate.Event.Name : null,
            CertificateTemplateId = certificate.CertificateTemplateId,
            TemplateName = certificate.CertificateTemplate != null ? certificate.CertificateTemplate.Name : null,
            CertificateType = certificate.CertificateType,
            Status = certificate.Status,
            GeneratedAt = certificate.GeneratedAt,
            IssuedAt = certificate.IssuedAt,
            FilePath = certificate.FilePath,
            RevocationReason = certificate.RevocationReason,
            RevokedBy = certificate.RevokedBy,
            RevokedAt = certificate.RevokedAt
        };
    }

    public async Task<CertificateDto?> GetByCertificateNumberAsync(string certificateNumber, CancellationToken token = default)
    {
        var certificate = await _certificateRepository.GetByCertificateNumberAsync(certificateNumber, token);
        if (certificate == null)
        {
            return null;
        }

        return new CertificateDto
        {
            Id = certificate.Id,
            CertificateNumber = certificate.CertificateNumber,
            ParticipantId = certificate.ParticipantId,
            ParticipantName = certificate.Participant != null ? certificate.Participant.FullName : null,
            ParticipantMembershipId = certificate.Participant != null ? certificate.Participant.MembershipId : null,
            EventId = certificate.EventId,
            EventName = certificate.Event != null ? certificate.Event.Name : null,
            CertificateTemplateId = certificate.CertificateTemplateId,
            TemplateName = certificate.CertificateTemplate != null ? certificate.CertificateTemplate.Name : null,
            CertificateType = certificate.CertificateType,
            Status = certificate.Status,
            GeneratedAt = certificate.GeneratedAt,
            IssuedAt = certificate.IssuedAt,
            FilePath = certificate.FilePath,
            RevocationReason = certificate.RevocationReason,
            RevokedBy = certificate.RevokedBy,
            RevokedAt = certificate.RevokedAt
        };
    }

    public async Task<IReadOnlyCollection<CertificateDto>> GetAllAsync(CancellationToken token = default)
    {
        var certificates = await _certificateRepository.GetAllAsync(token);
        var resultList = new List<CertificateDto>();

        foreach (var certificate in certificates)
        {
            resultList.Add(new CertificateDto
            {
                Id = certificate.Id,
                CertificateNumber = certificate.CertificateNumber,
                ParticipantId = certificate.ParticipantId,
                ParticipantName = certificate.Participant != null ? certificate.Participant.FullName : null,
                ParticipantMembershipId = certificate.Participant != null ? certificate.Participant.MembershipId : null,
                EventId = certificate.EventId,
                EventName = certificate.Event != null ? certificate.Event.Name : null,
                CertificateTemplateId = certificate.CertificateTemplateId,
                TemplateName = certificate.CertificateTemplate != null ? certificate.CertificateTemplate.Name : null,
                CertificateType = certificate.CertificateType,
                Status = certificate.Status,
                GeneratedAt = certificate.GeneratedAt,
                IssuedAt = certificate.IssuedAt,
                FilePath = certificate.FilePath,
                RevocationReason = certificate.RevocationReason,
                RevokedBy = certificate.RevokedBy,
                RevokedAt = certificate.RevokedAt
            });
        }

        return resultList;
    }

    public async Task<IReadOnlyCollection<CertificateDto>> GetByEventIdAsync(Guid eventId, CancellationToken token = default)
    {
        var certificates = await _certificateRepository.GetByEventIdAsync(eventId, token);
        var resultList = new List<CertificateDto>();

        foreach (var certificate in certificates)
        {
            resultList.Add(new CertificateDto
            {
                Id = certificate.Id,
                CertificateNumber = certificate.CertificateNumber,
                ParticipantId = certificate.ParticipantId,
                ParticipantName = certificate.Participant != null ? certificate.Participant.FullName : null,
                ParticipantMembershipId = certificate.Participant != null ? certificate.Participant.MembershipId : null,
                EventId = certificate.EventId,
                EventName = certificate.Event != null ? certificate.Event.Name : null,
                CertificateTemplateId = certificate.CertificateTemplateId,
                TemplateName = certificate.CertificateTemplate != null ? certificate.CertificateTemplate.Name : null,
                CertificateType = certificate.CertificateType,
                Status = certificate.Status,
                GeneratedAt = certificate.GeneratedAt,
                IssuedAt = certificate.IssuedAt,
                FilePath = certificate.FilePath,
                RevocationReason = certificate.RevocationReason,
                RevokedBy = certificate.RevokedBy,
                RevokedAt = certificate.RevokedAt
            });
        }

        return resultList;
    }

    public async Task<CertificateDto> CreateAsync(CreateCertificateDto dto, CancellationToken token = default)
    {
        var certificate = new Certificate
        {
            Id = Guid.NewGuid(),
            CertificateNumber = dto.CertificateNumber,
            ParticipantId = dto.ParticipantId,
            EventId = dto.EventId,
            CertificateTemplateId = dto.CertificateTemplateId,
            CertificateType = dto.CertificateType,
            Status = CertificateStatus.Generated,
            GeneratedAt = DateTime.UtcNow
        };

        await _certificateRepository.AddAsync(certificate, token);

        return new CertificateDto
        {
            Id = certificate.Id,
            CertificateNumber = certificate.CertificateNumber,
            ParticipantId = certificate.ParticipantId,
            EventId = certificate.EventId,
            CertificateTemplateId = certificate.CertificateTemplateId,
            CertificateType = certificate.CertificateType,
            Status = certificate.Status,
            GeneratedAt = certificate.GeneratedAt,
            IssuedAt = certificate.IssuedAt,
            FilePath = certificate.FilePath,
            RevocationReason = certificate.RevocationReason,
            RevokedBy = certificate.RevokedBy,
            RevokedAt = certificate.RevokedAt
        };
    }

    public async Task<CertificateDto?> UpdateAsync(Guid id, UpdateCertificateDto dto, CancellationToken token = default)
    {
        var certificate = await _certificateRepository.GetByIdAsync(id, token);
        if (certificate == null)
        {
            return null;
        }

        certificate.Status = dto.Status;
        certificate.FilePath = dto.FilePath;
        certificate.RevocationReason = dto.RevocationReason;
        certificate.RevokedBy = dto.RevokedBy;

        if (dto.Status == CertificateStatus.Revoked && certificate.RevokedAt == null)
        {
            certificate.RevokedAt = DateTime.UtcNow;
        }

        await _certificateRepository.UpdateAsync(certificate, token);

        return new CertificateDto
        {
            Id = certificate.Id,
            CertificateNumber = certificate.CertificateNumber,
            ParticipantId = certificate.ParticipantId,
            ParticipantName = certificate.Participant != null ? certificate.Participant.FullName : null,
            ParticipantMembershipId = certificate.Participant != null ? certificate.Participant.MembershipId : null,
            EventId = certificate.EventId,
            EventName = certificate.Event != null ? certificate.Event.Name : null,
            CertificateTemplateId = certificate.CertificateTemplateId,
            TemplateName = certificate.CertificateTemplate != null ? certificate.CertificateTemplate.Name : null,
            CertificateType = certificate.CertificateType,
            Status = certificate.Status,
            GeneratedAt = certificate.GeneratedAt,
            IssuedAt = certificate.IssuedAt,
            FilePath = certificate.FilePath,
            RevocationReason = certificate.RevocationReason,
            RevokedBy = certificate.RevokedBy,
            RevokedAt = certificate.RevokedAt
        };
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken token = default)
    {
        var certificate = await _certificateRepository.GetByIdAsync(id, token);
        if (certificate == null)
        {
            return false;
        }

        await _certificateRepository.DeleteAsync(id, token);
        return true;
    }
}

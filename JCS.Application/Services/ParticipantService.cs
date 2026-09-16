using JCS.Application.DTOs.Participant;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;
using JCS.Domain.Enum;

namespace JCS.Application.Services;

public class ParticipantService : IParticipantService
{
    private readonly IParticipantRepository _participantRepository;

    public ParticipantService(IParticipantRepository participantRepository)
    {
        _participantRepository = participantRepository;
    }

    public async Task<ParticipantDto?> GetByIdAsync(Guid id, CancellationToken token = default)
    {
        var participant = await _participantRepository.GetByIdAsync(id, token);
        if (participant == null)
        {
            return null;
        }

        return new ParticipantDto
        {
            Id = participant.Id,
            EventId = participant.EventId,
            MembershipId = participant.MembershipId,
            FullName = participant.FullName,
            Email = participant.Email,
            Phone = participant.Phone,
            Jamaat = participant.Jamaat,
            Dila = participant.Dila,
            Ilaqa = participant.Ilaqa,
            Auxiliary = participant.Auxiliary,
            IsVerified = participant.IsVerified,
            VerificationStatus = participant.VerificationStatus,
            VerificationMessage = participant.VerificationMessage,
            CreatedAt = participant.CreatedAt,
            VerifiedAt = participant.VerifiedAt
        };
    }

    public async Task<IReadOnlyCollection<ParticipantDto>> GetAllAsync(CancellationToken token = default)
    {
        var participants = await _participantRepository.GetAllAsync(token);
        var resultList = new List<ParticipantDto>();

        foreach (var participant in participants)
        {
            resultList.Add(new ParticipantDto
            {
                Id = participant.Id,
                EventId = participant.EventId,
                MembershipId = participant.MembershipId,
                FullName = participant.FullName,
                Email = participant.Email,
                Phone = participant.Phone,
                Jamaat = participant.Jamaat,
                Dila = participant.Dila,
                Ilaqa = participant.Ilaqa,
                Auxiliary = participant.Auxiliary,
                IsVerified = participant.IsVerified,
                VerificationStatus = participant.VerificationStatus,
                VerificationMessage = participant.VerificationMessage,
                CreatedAt = participant.CreatedAt,
                VerifiedAt = participant.VerifiedAt
            });
        }

        return resultList;
    }

    public async Task<IReadOnlyCollection<ParticipantDto>> GetByEventIdAsync(Guid eventId, CancellationToken token = default)
    {
        var participants = await _participantRepository.GetByEventIdAsync(eventId, token);
        var resultList = new List<ParticipantDto>();

        foreach (var participant in participants)
        {
            resultList.Add(new ParticipantDto
            {
                Id = participant.Id,
                EventId = participant.EventId,
                MembershipId = participant.MembershipId,
                FullName = participant.FullName,
                Email = participant.Email,
                Phone = participant.Phone,
                Jamaat = participant.Jamaat,
                Dila = participant.Dila,
                Ilaqa = participant.Ilaqa,
                Auxiliary = participant.Auxiliary,
                IsVerified = participant.IsVerified,
                VerificationStatus = participant.VerificationStatus,
                VerificationMessage = participant.VerificationMessage,
                CreatedAt = participant.CreatedAt,
                VerifiedAt = participant.VerifiedAt
            });
        }

        return resultList;
    }

    public async Task<ParticipantDto> CreateAsync(CreateParticipantDto dto, CancellationToken token = default)
    {
        var participant = new Participant
        {
            Id = Guid.NewGuid(),
            EventId = dto.EventId,
            MembershipId = dto.MembershipId,
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            Jamaat = dto.Jamaat,
            Dila = dto.Dila,
            Ilaqa = dto.Ilaqa,
            Auxiliary = dto.Auxiliary,
            IsVerified = false,
            VerificationStatus = VerificationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _participantRepository.AddAsync(participant, token);

        return new ParticipantDto
        {
            Id = participant.Id,
            EventId = participant.EventId,
            MembershipId = participant.MembershipId,
            FullName = participant.FullName,
            Email = participant.Email,
            Phone = participant.Phone,
            Jamaat = participant.Jamaat,
            Dila = participant.Dila,
            Ilaqa = participant.Ilaqa,
            Auxiliary = participant.Auxiliary,
            IsVerified = participant.IsVerified,
            VerificationStatus = participant.VerificationStatus,
            VerificationMessage = participant.VerificationMessage,
            CreatedAt = participant.CreatedAt,
            VerifiedAt = participant.VerifiedAt
        };
    }

    public async Task<ParticipantDto?> UpdateAsync(Guid id, UpdateParticipantDto dto, CancellationToken token = default)
    {
        var participant = await _participantRepository.GetByIdAsync(id, token);
        if (participant == null)
        {
            return null;
        }

        participant.FullName = dto.FullName;
        participant.Email = dto.Email;
        participant.Phone = dto.Phone;
        participant.Jamaat = dto.Jamaat;
        participant.Dila = dto.Dila;
        participant.Ilaqa = dto.Ilaqa;
        participant.Auxiliary = dto.Auxiliary;
        participant.IsVerified = dto.IsVerified;
        participant.VerificationStatus = dto.VerificationStatus;
        participant.VerificationMessage = dto.VerificationMessage;

        if (dto.IsVerified && participant.VerifiedAt == null)
        {
            participant.VerifiedAt = DateTime.UtcNow;
        }

        await _participantRepository.UpdateAsync(participant, token);

        return new ParticipantDto
        {
            Id = participant.Id,
            EventId = participant.EventId,
            MembershipId = participant.MembershipId,
            FullName = participant.FullName,
            Email = participant.Email,
            Phone = participant.Phone,
            Jamaat = participant.Jamaat,
            Dila = participant.Dila,
            Ilaqa = participant.Ilaqa,
            Auxiliary = participant.Auxiliary,
            IsVerified = participant.IsVerified,
            VerificationStatus = participant.VerificationStatus,
            VerificationMessage = participant.VerificationMessage,
            CreatedAt = participant.CreatedAt,
            VerifiedAt = participant.VerifiedAt
        };
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken token = default)
    {
        var participant = await _participantRepository.GetByIdAsync(id, token);
        if (participant == null)
        {
            return false;
        }

        await _participantRepository.DeleteAsync(id, token);
        return true;
    }
}

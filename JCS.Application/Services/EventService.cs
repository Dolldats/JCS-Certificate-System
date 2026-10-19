using JCS.Application.DTOs.Event;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;
using JCS.Domain.Enum;

namespace JCS.Application.Services;

public class EventService : IEventService
{
    private readonly IEventRepository _eventRepository;

    public EventService(IEventRepository eventRepository)
    {
        _eventRepository = eventRepository;
    }

    public async Task<EventDto?> GetByIdAsync(Guid id, CancellationToken token = default)
    {
        var eventItem = await _eventRepository.GetByIdAsync(id, token);
        if (eventItem == null)
        {
            return null;
        }

        return new EventDto
        {
            Id = eventItem.Id,
            Name = eventItem.Name,
            Description = eventItem.Description,
            EventType = eventItem.EventType,
            EventDate = eventItem.EventDate,
            EndDate = eventItem.EndDate,
            Venue = eventItem.Venue,
            Auxiliary = eventItem.Auxiliary,
            Ilaqa = eventItem.Ilaqa,
            OrganizationalLevel = eventItem.OrganizationalLevel,
            OrganizationalUnit = eventItem.OrganizationalUnit,
            Status = GetDateBasedStatus(eventItem),
            CreatedAt = eventItem.CreatedAt,
            ParticipantCount = VerifiedParticipantCount(eventItem),
            TotalParticipantCount = TotalParticipantCount(eventItem),
            CertificateCount = IssuedCertificateCount(eventItem)
        };
    }

    public async Task<IReadOnlyCollection<EventDto>> GetAllAsync(CancellationToken token = default)
    {
        var events = await _eventRepository.GetAllAsync(token);
        var resultList = new List<EventDto>();

        foreach (var eventItem in events)
        {
            resultList.Add(new EventDto
            {
                Id = eventItem.Id,
                Name = eventItem.Name,
                Description = eventItem.Description,
                EventType = eventItem.EventType,
                EventDate = eventItem.EventDate,
                EndDate = eventItem.EndDate,
                Venue = eventItem.Venue,
                Auxiliary = eventItem.Auxiliary,
                Ilaqa = eventItem.Ilaqa,
                OrganizationalLevel = eventItem.OrganizationalLevel,
                OrganizationalUnit = eventItem.OrganizationalUnit,
                Status = GetDateBasedStatus(eventItem),
                CreatedAt = eventItem.CreatedAt,
                ParticipantCount = VerifiedParticipantCount(eventItem),
                TotalParticipantCount = TotalParticipantCount(eventItem),
                CertificateCount = IssuedCertificateCount(eventItem)
            });
        }

        return resultList;
    }

    public async Task<IReadOnlyCollection<EventDto>> GetByAuxiliaryAsync(Auxiliary auxiliary, CancellationToken token = default)
    {
        var events = await _eventRepository.GetByAuxiliaryAsync(auxiliary, token);
        var resultList = new List<EventDto>();

        foreach (var eventItem in events)
        {
            resultList.Add(new EventDto
            {
                Id = eventItem.Id,
                Name = eventItem.Name,
                Description = eventItem.Description,
                EventType = eventItem.EventType,
                EventDate = eventItem.EventDate,
                EndDate = eventItem.EndDate,
                Venue = eventItem.Venue,
                Auxiliary = eventItem.Auxiliary,
                Ilaqa = eventItem.Ilaqa,
                OrganizationalLevel = eventItem.OrganizationalLevel,
                OrganizationalUnit = eventItem.OrganizationalUnit,
                Status = GetDateBasedStatus(eventItem),
                CreatedAt = eventItem.CreatedAt,
                ParticipantCount = VerifiedParticipantCount(eventItem),
                TotalParticipantCount = TotalParticipantCount(eventItem),
                CertificateCount = IssuedCertificateCount(eventItem)
            });
        }

        return resultList;
    }

    public async Task<EventDto> CreateAsync(CreateEventDto dto, CancellationToken token = default)
    {
        var newEvent = new Event
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            EventType = dto.EventType,
            EventDate = dto.EventDate,
            EndDate = dto.EndDate,
            Venue = dto.Venue,
            Auxiliary = dto.Auxiliary,
            Ilaqa = string.IsNullOrWhiteSpace(dto.Ilaqa) ? null : dto.Ilaqa.Trim(),
            OrganizationalLevel = dto.OrganizationalLevel,
            OrganizationalUnit = dto.OrganizationalUnit,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        await _eventRepository.AddAsync(newEvent, token);

        return new EventDto
        {
            Id = newEvent.Id,
            Name = newEvent.Name,
            Description = newEvent.Description,
            EventType = newEvent.EventType,
            EventDate = newEvent.EventDate,
            EndDate = newEvent.EndDate,
            Venue = newEvent.Venue,
            Auxiliary = newEvent.Auxiliary,
            Ilaqa = newEvent.Ilaqa,
            OrganizationalLevel = newEvent.OrganizationalLevel,
            OrganizationalUnit = newEvent.OrganizationalUnit,
            Status = GetDateBasedStatus(newEvent),
            CreatedAt = newEvent.CreatedAt,
            ParticipantCount = VerifiedParticipantCount(newEvent),
            TotalParticipantCount = TotalParticipantCount(newEvent),
            CertificateCount = IssuedCertificateCount(newEvent)
        };
    }

    public async Task<EventDto?> UpdateAsync(Guid id, UpdateEventDto dto, CancellationToken token = default)
    {
        var eventItem = await _eventRepository.GetByIdAsync(id, token);
        if (eventItem == null)
        {
            return null;
        }

        eventItem.Name = dto.Name;
        eventItem.Description = dto.Description;
        eventItem.EventType = dto.EventType;
        eventItem.EventDate = dto.EventDate;
        eventItem.EndDate = dto.EndDate;
        eventItem.Venue = dto.Venue;
        eventItem.Auxiliary = dto.Auxiliary;
        eventItem.Ilaqa = string.IsNullOrWhiteSpace(dto.Ilaqa) ? null : dto.Ilaqa.Trim();
        eventItem.OrganizationalLevel = dto.OrganizationalLevel;
        eventItem.OrganizationalUnit = dto.OrganizationalUnit;
        eventItem.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status;

        await _eventRepository.UpdateAsync(eventItem, token);

        return new EventDto
        {
            Id = eventItem.Id,
            Name = eventItem.Name,
            Description = eventItem.Description,
            EventType = eventItem.EventType,
            EventDate = eventItem.EventDate,
            EndDate = eventItem.EndDate,
            Venue = eventItem.Venue,
            Auxiliary = eventItem.Auxiliary,
            Ilaqa = eventItem.Ilaqa,
            OrganizationalLevel = eventItem.OrganizationalLevel,
            OrganizationalUnit = eventItem.OrganizationalUnit,
            Status = GetDateBasedStatus(eventItem),
            CreatedAt = eventItem.CreatedAt,
            ParticipantCount = VerifiedParticipantCount(eventItem),
            TotalParticipantCount = TotalParticipantCount(eventItem),
            CertificateCount = IssuedCertificateCount(eventItem)
        };
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken token = default)
    {
        var eventItem = await _eventRepository.GetByIdAsync(id, token);
        if (eventItem == null)
        {
            return false;
        }

        await _eventRepository.DeleteAsync(id, token);
        return true;
    }

    private static int VerifiedParticipantCount(Event eventItem) =>
        eventItem.Participants?.Count(x => x.IsVerified && x.VerificationStatus == VerificationStatus.Verified) ?? 0;

    private static int TotalParticipantCount(Event eventItem) => eventItem.Participants?.Count ?? 0;

    private static int IssuedCertificateCount(Event eventItem) =>
        eventItem.Certificates?.Count(x => x.Status == CertificateStatus.Issued) ?? 0;

    private static string GetDateBasedStatus(Event eventItem)
    {
        var today = DateTime.UtcNow.Date;
        var startDate = eventItem.EventDate.Date;
        var endDate = (eventItem.EndDate ?? eventItem.EventDate).Date;

        if (today < startDate)
        {
            return "Upcoming";
        }

        return today <= endDate ? "In Progress" : "Completed";
    }
}

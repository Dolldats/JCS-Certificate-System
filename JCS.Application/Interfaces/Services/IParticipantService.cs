using JCS.Application.DTOs.Participant;

namespace JCS.Application.Interfaces.Services;

public interface IParticipantService
{
    Task<ParticipantDto?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<ParticipantDto>> GetAllAsync(CancellationToken token = default);
    Task<ParticipantDto> CreateAsync(CreateParticipantDto dto, CancellationToken token = default);
    Task<ParticipantDto?> UpdateAsync(Guid id, UpdateParticipantDto dto, CancellationToken token = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken token = default);
}

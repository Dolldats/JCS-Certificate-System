using JCS.Application.DTOs.Participant;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;

namespace JCS.Application.Services;

public sealed class ParticipantService : IParticipantService
{
    private readonly IParticipantRepository _repository;
    public ParticipantService(IParticipantRepository repository) { _repository = repository; }
    public async Task<ParticipantDto?> GetByIdAsync(Guid id, CancellationToken token = default) => TakeToParticipantDto(await _repository.GetByIdAsync(id, token));
    public async Task<IReadOnlyCollection<ParticipantDto>> GetAllAsync(CancellationToken token = default) => (await _repository.GetAllAsync(token)).Select(TakeToParticipantDto).ToArray()!;
    public async Task<ParticipantDto> CreateAsync(CreateParticipantDto dto, CancellationToken token = default) { var participant = new Participant { Id = Guid.NewGuid(), MembershipId = dto.MembershipId, FullName = dto.FullName, Email = dto.Email }; await _repository.AddAsync(participant, token); return TakeToParticipantDto(participant)!; }
    public async Task<ParticipantDto?> UpdateAsync(Guid id, UpdateParticipantDto dto, CancellationToken token = default) { var participant = await _repository.GetByIdAsync(id, token); if (participant is null) return null; participant.FullName = dto.FullName; participant.Email = dto.Email; participant.IsVerified = dto.IsVerified; participant.VerificationStatus = dto.VerificationStatus; await _repository.UpdateAsync(participant, token); return TakeToParticipantDto(participant); }
    public async Task<bool> DeleteAsync(Guid id, CancellationToken token = default) { if (await _repository.GetByIdAsync(id, token) is null) return false; await _repository.DeleteAsync(id, token); return true; }
    private static ParticipantDto? TakeToParticipantDto(Participant? participant) => participant is null ? null : new() { Id = participant.Id, MembershipId = participant.MembershipId, FullName = participant.FullName, Email = participant.Email, IsVerified = participant.IsVerified, VerificationStatus = participant.VerificationStatus };
}

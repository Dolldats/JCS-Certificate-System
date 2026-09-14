using JCS.Application.DTOs.Participant;
using JCS.Application.Interfaces.Repositories;
using JCS.Application.Interfaces.Services;
using JCS.Domain.Entities;

namespace JCS.Application.Services;

public sealed class ParticipantService(IParticipantRepository repo) : IParticipantService
{
    public async Task<ParticipantDto?> GetByIdAsync(Guid id,CancellationToken t=default)=>Map(await repo.GetByIdAsync(id,t));
    public async Task<IReadOnlyCollection<ParticipantDto>> GetAllAsync(CancellationToken t=default)=>(await repo.GetAllAsync(t)).Select(x => Map(x)!).ToArray();
    public async Task<ParticipantDto> CreateAsync(CreateParticipantDto d,CancellationToken t=default){var e=new Participant{Id=Guid.NewGuid(),MembershipId=d.MembershipId,FullName=d.FullName,Email=d.Email};await repo.AddAsync(e,t);return Map(e)!;}
    public async Task<ParticipantDto?> UpdateAsync(Guid id,UpdateParticipantDto d,CancellationToken t=default){var e=await repo.GetByIdAsync(id,t);if(e is null)return null;e.FullName=d.FullName;e.Email=d.Email;e.IsVerified=d.IsVerified;e.VerificationStatus=d.VerificationStatus;await repo.UpdateAsync(e,t);return Map(e);}
    public async Task<bool> DeleteAsync(Guid id,CancellationToken t=default){if(await repo.GetByIdAsync(id,t)is null)return false;await repo.DeleteAsync(id,t);return true;}
    private static ParticipantDto? Map(Participant? e)=>e is null?null:new(e.Id,e.MembershipId,e.FullName,e.Email,e.IsVerified,e.VerificationStatus);
}

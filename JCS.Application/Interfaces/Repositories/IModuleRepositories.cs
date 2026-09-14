using JCS.Domain.Entities;

namespace JCS.Application.Interfaces.Repositories;

public interface IEventRepository
{
    Task<Event?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<Event>> GetAllAsync(CancellationToken token = default);
    Task AddAsync(Event entity, CancellationToken token = default);
    Task UpdateAsync(Event entity, CancellationToken token = default);
    Task DeleteAsync(Guid id, CancellationToken token = default);
}

public interface IParticipantRepository
{
    Task<Participant?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<Participant>> GetAllAsync(CancellationToken token = default);
    Task AddAsync(Participant entity, CancellationToken token = default);
    Task UpdateAsync(Participant entity, CancellationToken token = default);
    Task DeleteAsync(Guid id, CancellationToken token = default);
}

public interface ICertificateRepository
{
    Task<Certificate?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<Certificate>> GetAllAsync(CancellationToken token = default);
    Task AddAsync(Certificate entity, CancellationToken token = default);
    Task UpdateAsync(Certificate entity, CancellationToken token = default);
    Task DeleteAsync(Guid id, CancellationToken token = default);
}

public interface ICertificateTemplateRepository
{
    Task<CertificateTemplate?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<CertificateTemplate>> GetAllAsync(CancellationToken token = default);
    Task AddAsync(CertificateTemplate entity, CancellationToken token = default);
    Task UpdateAsync(CertificateTemplate entity, CancellationToken token = default);
    Task DeleteAsync(Guid id, CancellationToken token = default);
}

public interface IAuditLogRepository
{
    Task<AuditLog?> GetByIdAsync(Guid id, CancellationToken token = default);
    Task<IReadOnlyCollection<AuditLog>> GetAllAsync(CancellationToken token = default);
    Task AddAsync(AuditLog entity, CancellationToken token = default);
    Task UpdateAsync(AuditLog entity, CancellationToken token = default);
    Task DeleteAsync(Guid id, CancellationToken token = default);
}

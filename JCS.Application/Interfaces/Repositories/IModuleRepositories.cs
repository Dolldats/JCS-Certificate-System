using JCS.Domain.Entities;

namespace JCS.Application.Interfaces.Repositories;

public interface IEventRepository : IRepository<Event> { }
public interface IParticipantRepository : IRepository<Participant> { }
public interface ICertificateRepository : IRepository<Certificate> { }
public interface ICertificateTemplateRepository : IRepository<CertificateTemplate> { }
public interface IAuditLogRepository : IRepository<AuditLog> { }

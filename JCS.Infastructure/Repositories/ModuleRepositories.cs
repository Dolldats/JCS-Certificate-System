using JCS.Application.Interfaces.Repositories;
using JCS.Domain.Entities;
using JCS.Infastructure.Persistence;

namespace JCS.Infastructure.Repositories;

public sealed class EventRepository(JcsDbContext context) : EfRepository<Event>(context), IEventRepository;
public sealed class ParticipantRepository(JcsDbContext context) : EfRepository<Participant>(context), IParticipantRepository;
public sealed class CertificateRepository(JcsDbContext context) : EfRepository<Certificate>(context), ICertificateRepository;
public sealed class CertificateTemplateRepository(JcsDbContext context) : EfRepository<CertificateTemplate>(context), ICertificateTemplateRepository;
public sealed class AuditLogRepository(JcsDbContext context) : EfRepository<AuditLog>(context), IAuditLogRepository;

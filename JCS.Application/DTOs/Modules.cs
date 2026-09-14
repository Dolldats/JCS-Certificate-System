using JCS.Domain.Enum;

namespace JCS.Application.DTOs;

public record EventDto(Guid Id, string Name, string? Description, string EventType, DateTime EventDate, string Venue, Auxiliary Auxiliary, string? OrganizationalUnit, string Status);
public record CreateEventDto(string Name, string? Description, string EventType, DateTime EventDate, string Venue, Auxiliary Auxiliary, string? OrganizationalUnit);
public record UpdateEventDto(string Name, string? Description, string EventType, DateTime EventDate, string Venue, Auxiliary Auxiliary, string? OrganizationalUnit, string Status);

public record ParticipantDto(Guid Id, string MembershipId, string FullName, string? Email, bool IsVerified, string VerificationStatus);
public record CreateParticipantDto(string MembershipId, string FullName, string? Email);
public record UpdateParticipantDto(string FullName, string? Email, bool IsVerified, string VerificationStatus);

public record CertificateDto(Guid Id, string CertificateNumber, Guid ParticipantId, Guid EventId, Guid CertificateTemplateId, string CertificateType, string Status, DateTime GeneratedAt, string? FilePath);
public record CreateCertificateDto(string CertificateNumber, Guid ParticipantId, Guid EventId, Guid CertificateTemplateId, string CertificateType);
public record UpdateCertificateDto(string Status, string? FilePath);

public record CertificateTemplateDto(Guid Id, string Name, string? Description, string FilePath, string? ConfigurationJson, bool IsActive);
public record CreateCertificateTemplateDto(string Name, string? Description, string FilePath, string? ConfigurationJson);
public record UpdateCertificateTemplateDto(string Name, string? Description, string FilePath, string? ConfigurationJson, bool IsActive);

public record AuditLogDto(Guid Id, string Action, string PerformedBy, string? EntityName, string? EntityId, DateTime PerformedAt, string? Details);
public record CreateAuditLogDto(string Action, string PerformedBy, string? EntityName, string? EntityId, string? Details);

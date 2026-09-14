using JCS.Domain.Enum;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace JCS.Domain.Entities
{
    public class AdminAssignment
    {
        public Guid Id { get; set; }
        public string MembershipId { get; set; } = string.Empty;
        public Auxiliary Auxiliary { get; set; }
        public AdminStatus Status { get; set; } = AdminStatus.Active;
        public string AssignedBy { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; }
        public string? RevokedBy { get; set; }
        public DateTime? RevokedAt { get; set; }
    }
}

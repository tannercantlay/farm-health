// Models/HealthRecord.cs
namespace FarmHealth.Api.Models;

public class HealthRecord
{
    public int Id { get; set; }
    public DateTime RecordedAt { get; set; }
    public required string Status { get; set; }
    public string? Notes { get; set; }
    public int AnimalId { get; set; }
    public Animal Animal { get; set; } = null!;
}

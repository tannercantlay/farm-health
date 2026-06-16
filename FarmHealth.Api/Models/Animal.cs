// Models/Animal.cs
namespace FarmHealth.Api.Models;

public class Animal
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Species { get; set; }
    public int FarmId { get; set; }
    public Farm Farm { get; set; } = null!;
    public List<HealthRecord> HealthRecords { get; set; } = new();
}
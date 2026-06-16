// Dtos/HealthRecordDtos.cs
namespace FarmHealth.Api.Dtos;

public record HealthRecordResponse(int Id, DateTime RecordedAt, string Status, string? Notes, int AnimalId);
public record CreateHealthRecordRequest(string Status, string? Notes, int AnimalId);
public record UpdateHealthRecordRequest(string Status, string? Notes);

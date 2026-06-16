// Dtos/FarmDtos.cs
namespace FarmHealth.Api.Dtos;

public record FarmResponse(int Id, string Name, string? Location);
public record CreateFarmRequest(string Name, string? Location);
public record UpdateFarmRequest(string Name, string? Location);

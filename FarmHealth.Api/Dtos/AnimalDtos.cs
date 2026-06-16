// Dtos/AnimalDtos.cs
namespace FarmHealth.Api.Dtos;

public record AnimalResponse(int Id, string Name, string Species, int FarmId);
public record CreateAnimalRequest(string Name, string Species, int FarmId);
public record UpdateAnimalRequest(string Name, string Species);
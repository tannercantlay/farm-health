// Services/IAnimalService.cs
namespace FarmHealth.Api.Services;

using FarmHealth.Api.Dtos;

public interface IAnimalService
{
    Task<IReadOnlyList<AnimalResponse>> GetAllAsync();
    Task<AnimalResponse?> GetByIdAsync(int id);
    Task<AnimalResponse> CreateAsync(CreateAnimalRequest req);
    Task<bool> UpdateAsync(int id, UpdateAnimalRequest req);
    Task<bool> DeleteAsync(int id);
}
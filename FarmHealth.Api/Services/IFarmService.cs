// Services/IFarmService.cs
namespace FarmHealth.Api.Services;

using FarmHealth.Api.Dtos;

public interface IFarmService
{
    Task<IReadOnlyList<FarmResponse>> GetAllAsync();
    Task<FarmResponse?> GetByIdAsync(int id);
    Task<FarmResponse> CreateAsync(CreateFarmRequest req);
    Task<bool> UpdateAsync(int id, UpdateFarmRequest req);
    Task<bool> DeleteAsync(int id);
}

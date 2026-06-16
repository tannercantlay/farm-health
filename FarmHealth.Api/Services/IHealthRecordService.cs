// Services/IHealthRecordService.cs
namespace FarmHealth.Api.Services;

using FarmHealth.Api.Dtos;

public interface IHealthRecordService
{
    Task<IReadOnlyList<HealthRecordResponse>> GetByAnimalIdAsync(int animalId);
    Task<HealthRecordResponse?> GetByIdAsync(int id);
    Task<HealthRecordResponse> CreateAsync(CreateHealthRecordRequest req);
    Task<bool> UpdateAsync(int id, UpdateHealthRecordRequest req);
    Task<bool> DeleteAsync(int id);
}

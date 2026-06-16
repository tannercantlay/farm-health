// Services/HealthRecordService.cs
namespace FarmHealth.Api.Services;

using Microsoft.EntityFrameworkCore;
using FarmHealth.Api.Data;
using FarmHealth.Api.Dtos;
using FarmHealth.Api.Models;

public class HealthRecordService(AppDbContext db) : IHealthRecordService
{
    public async Task<IReadOnlyList<HealthRecordResponse>> GetByAnimalIdAsync(int animalId) =>
        await db.HealthRecords
            .AsNoTracking()
            .Where(h => h.AnimalId == animalId)
            .Select(h => new HealthRecordResponse(h.Id, h.RecordedAt, h.Status, h.Notes, h.AnimalId))
            .ToListAsync();

    public async Task<HealthRecordResponse?> GetByIdAsync(int id)
    {
        var record = await db.HealthRecords.AsNoTracking().FirstOrDefaultAsync(h => h.Id == id);
        if (record == null) return null;
        return new HealthRecordResponse(record.Id, record.RecordedAt, record.Status, record.Notes, record.AnimalId);
    }

    public async Task<HealthRecordResponse> CreateAsync(CreateHealthRecordRequest req)
    {
        var entity = new HealthRecord
        {
            Status = req.Status,
            Notes = req.Notes,
            AnimalId = req.AnimalId,
            RecordedAt = DateTime.UtcNow
        };
        db.HealthRecords.Add(entity);
        await db.SaveChangesAsync();
        return new HealthRecordResponse(entity.Id, entity.RecordedAt, entity.Status, entity.Notes, entity.AnimalId);
    }

    public async Task<bool> UpdateAsync(int id, UpdateHealthRecordRequest req)
    {
        var record = await db.HealthRecords.FindAsync(id);
        if (record == null) return false;
        record.Status = req.Status;
        record.Notes = req.Notes;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var record = await db.HealthRecords.FindAsync(id);
        if (record == null) return false;
        db.HealthRecords.Remove(record);
        await db.SaveChangesAsync();
        return true;
    }
}

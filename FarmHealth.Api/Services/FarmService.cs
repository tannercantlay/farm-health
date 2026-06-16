// Services/FarmService.cs
namespace FarmHealth.Api.Services;

using Microsoft.EntityFrameworkCore;
using FarmHealth.Api.Data;
using FarmHealth.Api.Dtos;
using FarmHealth.Api.Models;

public class FarmService(AppDbContext db) : IFarmService
{
    public async Task<IReadOnlyList<FarmResponse>> GetAllAsync() =>
        await db.Farms
            .AsNoTracking()
            .Select(f => new FarmResponse(f.Id, f.Name, f.Location))
            .ToListAsync();

    public async Task<FarmResponse?> GetByIdAsync(int id)
    {
        var farm = await db.Farms.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id);
        if (farm == null) return null;
        return new FarmResponse(farm.Id, farm.Name, farm.Location);
    }

    public async Task<FarmResponse> CreateAsync(CreateFarmRequest req)
    {
        var entity = new Farm { Name = req.Name, Location = req.Location };
        db.Farms.Add(entity);
        await db.SaveChangesAsync();
        return new FarmResponse(entity.Id, entity.Name, entity.Location);
    }

    public async Task<bool> UpdateAsync(int id, UpdateFarmRequest req)
    {
        var farm = await db.Farms.FindAsync(id);
        if (farm == null) return false;
        farm.Name = req.Name;
        farm.Location = req.Location;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var farm = await db.Farms.FindAsync(id);
        if (farm == null) return false;
        db.Farms.Remove(farm);
        await db.SaveChangesAsync();
        return true;
    }
}

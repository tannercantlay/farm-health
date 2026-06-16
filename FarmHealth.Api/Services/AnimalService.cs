// Services/AnimalService.cs
namespace FarmHealth.Api.Services;

using Microsoft.EntityFrameworkCore;
using FarmHealth.Api.Data;
using FarmHealth.Api.Dtos;
using FarmHealth.Api.Models;

public class AnimalService(AppDbContext db) : IAnimalService
{
    public async Task<IReadOnlyList<AnimalResponse>> GetAllAsync() =>
        await db.Animals
            .AsNoTracking()                          // read-only → skip change tracking
            .Select(a => new AnimalResponse(a.Id, a.Name, a.Species, a.FarmId))
            .ToListAsync();

    public async Task<AnimalResponse> CreateAsync(CreateAnimalRequest req)
    {
        var entity = new Animal { Name = req.Name, Species = req.Species, FarmId = req.FarmId };
        db.Animals.Add(entity);
        await db.SaveChangesAsync();
        return new AnimalResponse(entity.Id, entity.Name, entity.Species, entity.FarmId);
    }
    public async Task<AnimalResponse?> GetByIdAsync (int id)
    {
        var animal = await db.Animals
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);
        if (animal == null) return null;
        return new AnimalResponse(animal.Id, animal.Name, animal.Species, animal.FarmId);
    }
    public async Task<bool> UpdateAsync(int id, UpdateAnimalRequest req)
    {
        var animal = await db.Animals.FindAsync(id);
        if (animal == null) return false;
        animal.Name = req.Name;
        animal.Species = req.Species;
        await db.SaveChangesAsync();
        return true;
    }
    public async Task<bool> DeleteAsync(int id)
    {
        var animal = await db.Animals.FindAsync(id);
        if (animal == null) return false;
        db.Animals.Remove(animal);
        await db.SaveChangesAsync();
        return true;
    }
}
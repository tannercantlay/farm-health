using Microsoft.EntityFrameworkCore;
using FarmHealth.Api.Models;

namespace FarmHealth.Api.Data;
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Farm> Farms => Set<Farm>();
     public DbSet<Animal> Animals => Set<Animal>();
    public DbSet<HealthRecord> HealthRecords => Set<HealthRecord>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Cascade delete: removing a Farm removes its Animals & their records
        b.Entity<Animal>()
            .HasOne(a => a.Farm)
            .WithMany(f => f.Animals)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
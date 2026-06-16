namespace FarmHealth.Api.Models;
//Models/Farm.cs
public class Farm
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Location { get; set; }
    public List<Animal> Animals {get; set; } = new();
}